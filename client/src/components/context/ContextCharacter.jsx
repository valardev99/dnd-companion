import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function ContextCharacter() {
  const { state } = useGame();
  const ch = state.gameData.character;
  return (
    <div>
      <h3>Character Details</h3>
      <div className="card">
        <h4>Vitals Summary</h4>
        <div style={{fontFamily:"'Fira Code',monospace",fontSize:'0.75rem',color:'var(--silver)'}}>
          <div>HP: {ch.hp.current}/{ch.hp.max}</div>
          <div>EP: {ch.mp.current}/{ch.mp.max}</div>
          <div>Sanity: {ch.sanity.current}/{ch.sanity.max}</div>
        </div>
      </div>
      <div className="card">
        <h4>Active Stats</h4>
        <div style={{fontSize:'0.75rem',lineHeight:1.8}}>
          {Object.entries(ch.stats).map(([k, v]) => (
            <div key={k}>
              {k}: {v.value} {v.trend === 'up' ? '↑' : v.trend === 'down' ? '↓' : '·'}
              {v.trend !== 'stable' && <span style={{color:'var(--muted)'}}> (was {v.prevValue})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContextCharacter;
