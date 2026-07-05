import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function LevelUpOverlay() {
  const { state, dispatch } = useGame();
  if (!state.showLevelUp) return null;

  const newLevel = state.gameData.character.level || 1;
  const fromLevel = state.levelUpFrom ?? (newLevel - 1);

  return (
    <div
      className="levelup-overlay"
      role="dialog"
      aria-label={`Level up — you are now level ${newLevel}`}
      onClick={() => dispatch({ type: 'TOGGLE_LEVELUP', payload: false })}
    >
      {/* Radiating gold rays behind the text */}
      <div className="levelup-rays" aria-hidden="true" />
      <div className="levelup-content">
        <div className="levelup-title">LEVEL UP</div>
        <div className="levelup-level">Level {fromLevel} <span className="levelup-arrow">→</span> Level {newLevel}</div>
        <div className="levelup-flavor">Your legend grows. The DM will reveal what you have gained.</div>
        <div className="levelup-dismiss">Click anywhere to continue</div>
      </div>
    </div>
  );
}

export default LevelUpOverlay;
