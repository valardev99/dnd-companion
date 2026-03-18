import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext.jsx';

const IconHeart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCoin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 12h8"/>
  </svg>
);

function Header() {
  const { state, syncNow } = useGame();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const c = state.gameData.campaign;
  const ch = state.gameData.character;
  const hasActiveGame = c.session > 0 || ch.level > 0;

  const handleSaveAndQuit = async () => {
    setSaving(true);
    try {
      if (syncNow) await syncNow();
    } catch (e) {
      console.error('Save failed:', e);
    }
    setSaving(false);
    setShowQuitConfirm(false);
    navigate('/play');
  };

  return (
    <>
      <header className="app-header">
        <Link to="/play" className="header-avatar-frame">
          <span className="header-avatar-initial">
            {ch?.name?.[0]?.toUpperCase() || 'W'}
          </span>
        </Link>
        <div className="header-title">{c.name}</div>
        <div className="header-divider" />
        <div className="header-stat">
          <span className="label">Session</span>
          <span className="value">{hasActiveGame ? c.session : '\u2014'}</span>
        </div>
        <div className="header-stat">
          <span className="label">Day</span>
          <span className="value">{hasActiveGame ? c.day : '\u2014'}</span>
        </div>
        <div className="header-stat">
          <span className="label">Time</span>
          <span className="value">{hasActiveGame ? c.time : '\u2014'}</span>
        </div>
        <div className="header-divider" />
        <div className="header-stat">
          <IconStar />
          <span className="label">Level</span>
          <span className="header-stat-value">{hasActiveGame ? ch.level : '\u2014'}</span>
        </div>
        <div className="header-stat">
          <IconHeart />
          <span className="label">HP</span>
          <span className={`header-stat-value${hasActiveGame && ch.hp.current < ch.hp.max * 0.5 ? ' hp-low' : ''}`}>
            {hasActiveGame ? `${ch.hp.current}/${ch.hp.max}` : '\u2014'}
          </span>
        </div>
        <div className="header-stat">
          <IconCoin />
          <span className="label">Gold</span>
          <span className="header-stat-value">{hasActiveGame ? (ch.gold ?? 0) : '\u2014'}</span>
        </div>
      </header>

      {/* Save & Quit confirmation modal */}
      {showQuitConfirm && (
        <div className="save-quit-overlay" onClick={() => setShowQuitConfirm(false)}>
          <div className="save-quit-modal" onClick={e => e.stopPropagation()}>
            <h3 className="save-quit-title">{'\u2694\uFE0F'} Leave Adventure?</h3>
            <p className="save-quit-desc">
              Your progress will be saved. You can resume this campaign anytime from the hub.
            </p>
            <div className="save-quit-actions">
              <button
                className="save-quit-btn save-quit-cancel"
                onClick={() => setShowQuitConfirm(false)}
              >
                Keep Playing
              </button>
              <button
                className="save-quit-btn save-quit-confirm"
                onClick={handleSaveAndQuit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save & Quit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
