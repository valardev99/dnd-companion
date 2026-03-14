import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function SharePage() {
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShare = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/share/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('This journey could not be found. It may have been removed or the link is invalid.');
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to load shared journey');
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message || 'Failed to load this journey.');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchShare();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="share-page">
        <div className="share-loading">
          <div className="stories-spinner" />
          <span>Unrolling the ancient scroll...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="share-page">
        <div className="share-error-container">
          <div className="share-error-icon">{'\uD83D\uDDDD\uFE0F'}</div>
          <h2>Journey Not Found</h2>
          <p>{error}</p>
          <Link to="/" className="stories-cta-btn">Return Home</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Normalize field names (support both camelCase and snake_case from API)
  const campaignName = data.campaign_name || data.campaignName || 'Unknown Campaign';
  const characterName = data.character_name || data.characterName || 'Unknown Hero';
  const characterClass = data.character_class || data.characterClass || '';
  const characterRace = data.character_race || data.characterRace || '';
  const level = data.level || 1;
  const worldName = data.world_name || data.worldName || '';
  const recap = data.recap || data.content || data.text || '';
  const hp = data.hp || data.hit_points || null;
  const questsCompleted = data.quests_completed || data.questsCompleted || 0;
  const npcsMet = data.npcs_met || data.npcsMet || 0;
  const sessions = data.sessions || data.session_count || 0;
  const totalXp = data.total_xp || data.totalXp || 0;

  return (
    <div className="share-page">
      {/* Ambient Background */}
      <div className="share-bg-glow" />

      {/* Navigation */}
      <nav className="stories-nav">
        <Link to="/" className="stories-nav-brand">WANDERLORE</Link>
        <div className="stories-nav-links">
          <Link to="/">Home</Link>
          <Link to="/play">Play</Link>
          <Link to="/stories">Stories</Link>
        </div>
      </nav>

      <div className="share-content">
        {/* Header */}
        <header className="share-header">
          <div className="share-rune-line">{'\u2726'} {'\u2726'} {'\u2726'}</div>
          <h1 className="share-campaign-name">{campaignName}</h1>
          {worldName && (
            <div className="share-world-name">{'\uD83C\uDF0D'} {worldName}</div>
          )}
          <div className="share-divider" />
        </header>

        {/* Character Card */}
        <div className="share-character-card">
          <div className="share-character-portrait">
            <span className="share-portrait-icon">{'\u2694\uFE0F'}</span>
          </div>
          <div className="share-character-info">
            <h2 className="share-character-name">{characterName}</h2>
            <div className="share-character-details">
              {characterRace && <span className="share-detail-tag">{characterRace}</span>}
              {characterClass && <span className="share-detail-tag">{characterClass}</span>}
              <span className="share-detail-tag share-level-tag">Level {level}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="share-stats-row">
          {hp && (
            <div className="share-stat">
              <div className="share-stat-icon">{'\u2764\uFE0F'}</div>
              <div className="share-stat-value">{typeof hp === 'object' ? `${hp.current}/${hp.max}` : hp}</div>
              <div className="share-stat-label">Hit Points</div>
            </div>
          )}
          {sessions > 0 && (
            <div className="share-stat">
              <div className="share-stat-icon">{'\uD83D\uDCC5'}</div>
              <div className="share-stat-value">{sessions}</div>
              <div className="share-stat-label">Sessions</div>
            </div>
          )}
          {questsCompleted > 0 && (
            <div className="share-stat">
              <div className="share-stat-icon">{'\uD83D\uDCDC'}</div>
              <div className="share-stat-value">{questsCompleted}</div>
              <div className="share-stat-label">Quests Done</div>
            </div>
          )}
          {npcsMet > 0 && (
            <div className="share-stat">
              <div className="share-stat-icon">{'\uD83D\uDDE3\uFE0F'}</div>
              <div className="share-stat-value">{npcsMet}</div>
              <div className="share-stat-label">NPCs Met</div>
            </div>
          )}
          {totalXp > 0 && (
            <div className="share-stat">
              <div className="share-stat-icon">{'\u2B50'}</div>
              <div className="share-stat-value">{totalXp.toLocaleString()}</div>
              <div className="share-stat-label">Total XP</div>
            </div>
          )}
        </div>

        {/* Recap */}
        {recap && (
          <div className="share-recap-section">
            <h3 className="share-recap-heading">
              <span>{'\uD83D\uDCD6'}</span> The Tale So Far
            </h3>
            <div className="share-recap-text">
              {recap}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="share-cta-section">
          <div className="share-cta-divider" />
          <h3 className="share-cta-title">Forge Your Own Legend</h3>
          <p className="share-cta-subtitle">
            Every adventurer's story begins with a single step into the unknown.
          </p>
          <Link to="/play" className="stories-cta-btn">
            Start Your Own Adventure
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="stories-footer">
        <span className="stories-footer-brand">WANDERLORE</span>
        <div className="stories-footer-links">
          <Link to="/">Home</Link>
          <Link to="/play">Play</Link>
          <Link to="/stories">Stories</Link>
        </div>
        <span className="stories-footer-copy">Forged in imagination</span>
      </footer>
    </div>
  );
}
