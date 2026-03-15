import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AddFriendModal({ onClose, onAdded }) {
  const { authFetch } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(''); // 'success' | 'error' | ''
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      setStatus('error');
      setMessage('Please enter a valid friend code');
      return;
    }
    setSubmitting(true);
    setStatus('');
    setMessage('');
    try {
      const res = await authFetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_code: code.trim().replace('#', '') }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Friend request sent!');
        setCode('');
        if (onAdded) onAdded();
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.detail || 'Failed to send request');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Failed to send request');
    }
    setSubmitting(false);
  };

  return (
    <div className="archive-modal-overlay" onClick={onClose}>
      <div className="archive-modal add-friend-modal" onClick={e => e.stopPropagation()}>
        <h2 className="archive-modal-title">Add Ally</h2>
        <p style={{ fontFamily: "'Crimson Text', serif", color: 'var(--silver)', marginBottom: 16, fontSize: '0.95rem' }}>
          Enter your ally's friend code to send a request.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="archive-modal-field">
            <label className="archive-modal-label">Friend Code</label>
            <input
              type="text"
              className="archive-modal-input"
              placeholder="e.g. A1B2C3D4"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoFocus
            />
          </div>

          {status === 'success' && (
            <div style={{ padding: '8px 12px', background: 'rgba(46, 125, 50, 0.15)', border: '1px solid var(--emerald)', color: 'var(--emerald-bright)', fontSize: '0.85rem', fontFamily: "'Crimson Text', serif", marginBottom: 12 }}>
              {message}
            </div>
          )}
          {status === 'error' && (
            <div className="archive-modal-error">{message}</div>
          )}

          <div className="archive-modal-actions">
            <button type="button" className="archive-modal-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="campaign-detail-launch"
              disabled={submitting || !code.trim()}
              style={{ fontSize: '0.85rem', padding: '10px 24px' }}
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
