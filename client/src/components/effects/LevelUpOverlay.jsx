import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function LevelUpOverlay() {
  const { state, dispatch } = useGame();
  if (!state.showLevelUp) return null;
  return (
    <div className="levelup-overlay" onClick={() => dispatch({ type: 'TOGGLE_LEVELUP', payload: false })}>
      <div className="levelup-content">
        <div className="levelup-title">LEVEL UP</div>
        <div className="levelup-level">Level {state.gameData.character.level} → Level {state.gameData.character.level + 1}</div>
        <div className="levelup-rewards" style={{ fontFamily: "'Fira Code', monospace" }}>
          <div>═══════════════════════════════════</div>
          <div style={{marginTop:8}}>Await your DM's narration...</div>
          <div style={{marginTop:8}}>═══════════════════════════════════</div>
          <div style={{marginTop:16,color:'var(--muted)',fontSize:'0.75rem'}}>Click anywhere to dismiss</div>
        </div>
      </div>
    </div>
  );
}

export default LevelUpOverlay;
