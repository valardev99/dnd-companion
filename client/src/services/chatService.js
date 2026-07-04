import { parseMetadataTags, dispatchTagActions } from '../utils/tagParser.js';
import { buildSystemPrompt } from '../utils/systemPrompt.js';

// ═══════════════════════════════════════════════════════════════
// STREAMING CHAT — sends messages to API, processes SSE stream
// ═══════════════════════════════════════════════════════════════

// One stream at a time. The controller lets the UI cancel an in-flight
// generation (Stop button); the flag prevents two concurrent loops from
// fighting over the stream placeholder.
let activeController = null;

function isStreamActive() {
  return activeController !== null;
}

function stopStreaming() {
  if (activeController) {
    activeController.abort();
  }
}

async function sendChatMessage(message, state, dispatch) {
  if (!state.apiKey) {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'system', content: '⚠ No API key configured. Go to Settings → API Configuration to add your key.' } });
    return;
  }

  // Hard guard against concurrent streams — the isStreaming render-state
  // check in ChatPanel can race (auto-opening effect + user send in the
  // same commit window).
  if (activeController) return;
  activeController = new AbortController();

  // Add player message
  dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'player', content: message } });

  // Build messages for API (last 40 messages for context)
  const recentMessages = [...state.chatMessages, { role: 'player', content: message }].slice(-40).map(m => ({
    role: m.role === 'player' ? 'user' : 'assistant',
    content: m.content,
  })).filter(m => m.role === 'user' || m.role === 'assistant');

  // Add placeholder DM message for streaming — targeted by id so a message
  // appended mid-stream (multiplayer relay, system notice) can't hijack it.
  const streamId = `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'dm', content: '', id: streamId } });
  dispatch({ type: 'SET_STREAMING', payload: true });

  const systemPrompt = buildSystemPrompt(state.dmEngine, state.gameData, state.worldBible, state.dmStyle);
  const setStreamText = (content) =>
    dispatch({ type: 'UPDATE_STREAM_TEXT', payload: { id: streamId, content } });

  let fullText = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: activeController.signal,
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
      setStreamText(`⚠ Error: ${err.detail || err.message || 'Unknown error'}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
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
            setStreamText(cleanText);
          }
          if (event.type === 'error') {
            setStreamText(`⚠ ${event.error?.message || 'Stream error'}`);
          }
        } catch(e) { /* skip unparseable SSE lines */ }
      }
      if (streamDone) break;
    }

    // Final parse — dispatch metadata tags
    const { cleanText, tags } = parseMetadataTags(fullText);
    setStreamText(cleanText);
    if (tags.length > 0) dispatchTagActions(tags, dispatch, state);

  } catch (err) {
    if (err.name === 'AbortError') {
      // User pressed Stop — keep whatever streamed so far, mark it plainly
      const { cleanText } = parseMetadataTags(fullText);
      setStreamText(cleanText ? `${cleanText}\n\n— generation stopped —` : '— generation stopped —');
    } else {
      setStreamText(`⚠ Connection error: ${err.message}`);
    }
  } finally {
    activeController = null;
    dispatch({ type: 'SET_STREAMING', payload: false });
  }
}

export { sendChatMessage, stopStreaming, isStreamActive };
