import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext.jsx';

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
        <button
          className="header-back-btn"
          onClick={() => setShowQuitConfirm(true)}
          title="Save & Return to Hub"
        >
          {'\u27F5'}
        </button>
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
          <span className="label">Level</span>
          <span className="value">{hasActiveGame ? ch.level : '\u2014'}</span>
        </div>
        <div className="header-stat">
          <span className="label">HP</span>
          <span className="value" style={{color: hasActiveGame && ch.hp.current < ch.hp.max * 0.5 ? 'var(--crimson-bright)' : 'var(--parchment)'}}>
            {hasActiveGame ? `${ch.hp.current}/${ch.hp.max}` : '\u2014'}
          </span>
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
