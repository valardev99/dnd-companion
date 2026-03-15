import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function ArchiveModal({ campaign, onConfirm, onCancel }) {
  const { authFetch } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [summary, setSummary] = useState('');
  const [ending, setEnding] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nameMatch = confirmText.trim().toLowerCase() === (campaign.name || '').trim().toLowerCase();

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

        <div className="archive-modal-field">
          <label className="archive-modal-label">Summary (optional)</label>
          <textarea
            className="archive-modal-textarea"
            placeholder="A brief summary of the adventure..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={3}
          />
        </div>

        <div className="archive-modal-field">
          <label className="archive-modal-label">Ending (optional)</label>
          <textarea
            className="archive-modal-textarea"
            placeholder="How did the story end?"
            value={ending}
            onChange={e => setEnding(e.target.value)}
            rows={3}
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
