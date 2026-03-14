import React, { useState } from 'react';

/**
 * Feedback widget — bottom-right floating button that expands into a panel.
 */
function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const categories = [
    { id: 'idea', label: '💡 Idea', desc: 'Feature request or suggestion' },
    { id: 'bug', label: '🐛 Bug', desc: 'Something broken or unexpected' },
    { id: 'question', label: '❓ Question', desc: 'Need help or clarification' },
  ];

  const submit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim() }),
      });
      setSent(true);
      setMessage('');
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
      }, 2000);
    } catch (e) {
      console.error('Feedback submit failed:', e);
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating toggle button — bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Send Feedback"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 9999,
          background: isOpen ? 'var(--stone)' : 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
          color: isOpen ? 'var(--gold)' : 'var(--obsidian)',
          border: `1px solid ${isOpen ? 'var(--gold-dim)' : 'transparent'}`,
          width: 44,
          height: 44,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Expandable panel — above the button */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 76,
            width: 320,
            maxHeight: 420,
            background: 'var(--obsidian)',
            border: '1px solid var(--gold-dim)',
            borderRadius: 12,
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold-bright)', marginBottom: 12, fontSize: '0.95rem' }}>
            Send Feedback
          </h3>

          {/* Category selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  background: category === cat.id ? 'rgba(201,168,76,0.15)' : 'var(--stone)',
                  border: `1px solid ${category === cat.id ? 'var(--gold)' : 'var(--border-dim)'}`,
                  borderRadius: 6,
                  color: category === cat.id ? 'var(--gold)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontFamily: "'Fira Code', monospace",
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 10 }}>
            {categories.find(c => c.id === category)?.desc}
          </div>

          {/* Message textarea */}
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
            style={{
              minHeight: 120,
              maxHeight: 200,
              background: 'var(--stone)',
              border: '1px solid var(--border-dim)',
              borderRadius: 8,
              color: 'var(--parchment)',
              padding: 10,
              fontSize: '0.8rem',
              fontFamily: "'Crimson Text', serif",
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />

          {/* Submit */}
          <button
            onClick={submit}
            disabled={sending || !message.trim()}
            style={{
              marginTop: 12,
              padding: '10px 20px',
              background: sent ? 'rgba(76, 175, 80, 0.2)' : sending ? 'var(--stone)' : 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
              border: `1px solid ${sent ? 'rgba(76,175,80,0.5)' : 'var(--gold-dim)'}`,
              borderRadius: 8,
              color: sent ? '#4caf50' : 'var(--obsidian)',
              cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
              fontFamily: "'Cinzel', serif",
              fontWeight: 'bold',
              fontSize: '0.8rem',
              opacity: !message.trim() && !sent ? 0.5 : 1,
            }}
          >
            {sent ? '✓ Sent!' : sending ? 'Sending...' : 'Submit'}
          </button>
        </div>
      )}
    </>
  );
}

export default FeedbackWidget;
