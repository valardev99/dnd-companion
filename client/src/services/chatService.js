import { parseMetadataTags, dispatchTagActions } from '../utils/tagParser.js';
import { buildSystemPrompt } from '../utils/systemPrompt.js';

// ═══════════════════════════════════════════════════════════════
// STREAMING CHAT — sends messages to API, processes SSE stream
// ═══════════════════════════════════════════════════════════════

async function sendChatMessage(message, state, dispatch) {
  if (!state.apiKey) {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'system', content: '⚠ No API key configured. Go to Settings → API Configuration to add your key.' } });
    return;
  }

  // Add player message
  dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'player', content: message } });

  // Build messages for API (last 40 messages for context)
  const recentMessages = [...state.chatMessages, { role: 'player', content: message }].slice(-40).map(m => ({
    role: m.role === 'player' ? 'user' : 'assistant',
    content: m.content,
  })).filter(m => m.role === 'user' || m.role === 'assistant');

  // Add placeholder DM message for streaming
  dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'dm', content: '' } });
  dispatch({ type: 'SET_STREAMING', payload: true });

  const systemPrompt = buildSystemPrompt(state.dmEngine, state.gameData, state.worldBible, state.dmStyle);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: state.apiKey,
        model: state.model,
        provider: state.apiProvider || 'openrouter',
        messages: recentMessages,
        systemPrompt,
        maxTokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Connection failed' }));
      dispatch({ type: 'UPDATE_STREAM_TEXT', payload: `⚠ Error: ${err.message || 'Unknown error'}` });
      dispatch({ type: 'SET_STREAMING', payload: false });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let streamDone = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done || streamDone) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { streamDone = true; break; }

        try {
          const event = JSON.parse(data);
          if (event.type === 'message_stop') { streamDone = true; break; }
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullText += event.delta.text;
            const { cleanText } = parseMetadataTags(fullText);
            dispatch({ type: 'UPDATE_STREAM_TEXT', payload: cleanText });
          }
          if (event.type === 'error') {
            dispatch({ type: 'UPDATE_STREAM_TEXT', payload: `⚠ ${event.error?.message || 'Stream error'}` });
          }
        } catch(e) { /* skip unparseable SSE lines */ }
      }
      if (streamDone) break;
    }

    // Final parse — dispatch metadata tags
    const { cleanText, tags } = parseMetadataTags(fullText);
    dispatch({ type: 'UPDATE_STREAM_TEXT', payload: cleanText });
    if (tags.length > 0) dispatchTagActions(tags, dispatch, state);

  } catch (err) {
    dispatch({ type: 'UPDATE_STREAM_TEXT', payload: `⚠ Connection error: ${err.message}` });
  }

  dispatch({ type: 'SET_STREAMING', payload: false });
}

export { sendChatMessage };
