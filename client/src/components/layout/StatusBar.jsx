import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/statusbar.css';

export default function StatusBar({ onMobilePanelSelect }) {
  const { state, dispatch } = useGame();
  const { character } = state.gameData;
  const hp = character.hp || { current: 0, max: 1 };
  const hpPercent = Math.round((hp.current / hp.max) * 100);

  const handleClick = () => {
    dispatch({ type: 'SET_PANEL', payload: 'character' });
    // On mobile the companion panel is display:none — SET_PANEL alone is a
    // no-op there. Open the full-screen mobile overlay instead.
    if (onMobilePanelSelect && window.innerWidth < 768) {
      onMobilePanelSelect('character');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="status-bar"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open character sheet — ${character.name || 'Hero'}, HP ${hp.current} of ${hp.max}`}
    >
      <div className="status-bar-left">
        <span className="status-char-name">{character.name || 'Hero'}</span>
        {character.level && (
          <span className="status-level">Lvl {character.level}</span>
        )}
        <span className="status-label">HP</span>
        <div className="status-hp-bar">
          <div
            className="status-hp-fill"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="status-hp-text">{hp.current}/{hp.max}</span>
        {character.ac && (
          <>
            <span className="status-label">AC</span>
            <span className="status-ac">{character.ac}</span>
          </>
        )}
      </div>
    </div>
  );
}
