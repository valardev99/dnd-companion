import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ArchiveModal({ campaign, onConfirm, onCancel }) {
  const { authFetch } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [summary, setSummary] = useState('');
  const [ending, setEnding] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const nameMatch = confirmText.trim().toLowerCase() === (campaign.name || '').trim().toLowerCase();

  const apiKey = localStorage.getItem('dnd-apiKey') || sessionStorage.getItem('dnd-apiKey') || '';
  const model = localStorage.getItem('dnd-model') || 'google/gemini-2.5-flash';

  const generateRecap = async () => {
    if (!apiKey) {
      setError('API key required — set one in Settings to generate a recap.');
      return;
    }
    setGenerating(true);
    setError('');

    // Build context from campaign data
    const gameData = campaign.game_data || {};
    const character = gameData.character || {};
    const campaignInfo = gameData.campaign || {};
    const chatHistory = campaign.chat_history || [];

    // Get last ~20 messages for context
    const recentMessages = chatHistory.slice(-20).map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    const contextParts = [];
    if (campaign.name) contextParts.push(`Campaign: ${campaign.name}`);
    if (campaignInfo.premise) contextParts.push(`Premise: ${campaignInfo.premise}`);
    if (campaign.world_summary) contextParts.push(`World: ${campaign.world_summary}`);
    if (character.name) contextParts.push(`Character: ${character.name}, ${character.race || ''} ${character.class || ''} Level ${character.level || 1}`);
    if (campaign.session_recap) contextParts.push(`Last session recap: ${campaign.session_recap}`);

    const systemPrompt = `You are a fantasy narrator. The player is archiving (ending) their campaign. Based on the campaign context and recent story events, write TWO sections:

SUMMARY: A 5-sentence recap of the entire adventure — the key events, turning points, and memorable moments.

ENDING: A 5-sentence narrative ending for the story — a satisfying conclusion that wraps up the character's journey, written in past tense like an epilogue.

Format your response exactly like this:
SUMMARY:
(5 sentences here)

ENDING:
(5 sentences here)

Keep the tone dramatic and fitting for a dark fantasy adventure. Reference specific events from the story if possible.`;

    const messages = [
      ...recentMessages,
      {
        role: 'user',
        content: `The campaign "${campaign.name}" is being archived. ${contextParts.join('. ')}. Please generate a summary and ending.`,
      },
    ];

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model,
          messages,
          systemPrompt,
          maxTokens: 1024,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate recap');
      }

      // Read the SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              // Backend translates OpenRouter SSE into normalized format
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullText += parsed.delta.text;
              }
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }

      // Parse the response into summary and ending
      const summaryMatch = fullText.match(/SUMMARY:\s*([\s\S]*?)(?=ENDING:|$)/i);
      const endingMatch = fullText.match(/ENDING:\s*([\s\S]*?)$/i);

      if (summaryMatch) setSummary(summaryMatch[1].trim());
      if (endingMatch) setEnding(endingMatch[1].trim());

      if (!summaryMatch && !endingMatch) {
        // Fallback: use whole response as summary
        setSummary(fullText.trim());
      }
    } catch (e) {
      setError(e.message || 'Failed to generate recap');
    }
    setGenerating(false);
  };

  const handleSubmit = async () => {
    if (!nameMatch) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch(`/api/campaigns/${campaign.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation_text: confirmText, summary, ending }),
      });
      if (res.ok) {
        onConfirm();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to archive campaign');
      }
    } catch (e) {
      setError('Failed to archive campaign');
    }
    setSubmitting(false);
  };

  return (
    <div className="archive-modal-overlay" onClick={onCancel}>
      <div className="archive-modal" onClick={e => e.stopPropagation()}>
        <h2 className="archive-modal-title">Archive Campaign</h2>

        <div className="archive-modal-warning">
          This will archive <strong>{campaign.name}</strong>. Archived campaigns cannot be resumed, though their story remains preserved in the annals.
        </div>

        {/* AI Generate Button */}
        <button
          className="archive-generate-btn"
          onClick={generateRecap}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="archive-generate-spinner" />
              Consulting the oracle...
            </>
          ) : (
            <>{'\u2728'} Generate Recap with AI</>
          )}
        </button>

        <div className="archive-modal-field">
          <label className="archive-modal-label">Summary</label>
          <textarea
            className="archive-modal-textarea"
            placeholder="A brief summary of the adventure..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={4}
          />
        </div>

        <div className="archive-modal-field">
          <label className="archive-modal-label">Ending</label>
          <textarea
            className="archive-modal-textarea"
            placeholder="How did the story end?"
            value={ending}
            onChange={e => setEnding(e.target.value)}
            rows={4}
          />
        </div>

        <div className="archive-modal-field">
          <label className="archive-modal-label">
            Type <strong style={{ color: 'var(--gold)' }}>{campaign.name}</strong> to confirm
          </label>
          <input
            type="text"
            className="archive-modal-input"
            placeholder={campaign.name}
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
          />
        </div>

        {error && <div className="archive-modal-error">{error}</div>}

        <div className="archive-modal-actions">
          <button className="archive-modal-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="archive-modal-confirm"
            onClick={handleSubmit}
            disabled={!nameMatch || submitting}
          >
            {submitting ? 'Archiving...' : 'Archive Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}
