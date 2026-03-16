import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/statusbar.css';

export default function StatusBar() {
  const { state, dispatch } = useGame();
  const { character } = state.gameData;
  const hp = character.hp || { current: 0, max: 1 };
  const hpPercent = Math.round((hp.current / hp.max) * 100);

  const handleClick = () => {
    dispatch({ type: 'SET_PANEL', payload: 'character' });
  };

  return (
    <div className="status-bar" onClick={handleClick} role="button" tabIndex={0}>
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
