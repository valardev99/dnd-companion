import React, { useState, useEffect } from 'react';

/**
 * Subtle 1-5 star rating widget that appears after DM responses.
 * Fades out after 10 seconds if not interacted with.
 */
function SessionRating({ messageId, onRate }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(true);

  // Auto-fade after 10 seconds
  useEffect(() => {
    if (submitted) return;
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [submitted]);

  const handleRate = async (value) => {
    setRating(value);
    setSubmitted(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'rating',
          message: `Session rating: ${value}/5`,
          rating: value,
        }),
      });
    } catch (e) {
      // Silent fail — ratings are non-critical
    }
    if (onRate) onRate(value);
    setTimeout(() => setVisible(false), 2000);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        opacity: submitted ? 0.6 : 0.4,
        transition: 'opacity 0.3s',
        fontSize: '0.7rem',
      }}
      onMouseEnter={e => { if (!submitted) e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={e => { if (!submitted) e.currentTarget.style.opacity = '0.4'; }}
    >
      {submitted ? (
        <span style={{ color: 'var(--gold-dim)', fontFamily: "'Fira Code', monospace" }}>
          ✓ Rated {rating}/5
        </span>
      ) : (
        <>
          <span style={{ color: 'var(--muted)', fontFamily: "'Fira Code', monospace", marginRight: 4 }}>
            Rate:
          </span>
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              style={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: star <= (hoveredStar || rating) ? 'var(--gold)' : 'var(--border-dim)',
                transition: 'color 0.15s, transform 0.15s',
                transform: star <= hoveredStar ? 'scale(1.2)' : 'scale(1)',
                display: 'inline-block',
              }}
            >
              ★
            </span>
          ))}
        </>
      )}
    </div>
  );
}

export default SessionRating;
