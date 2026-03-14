import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { StatBar } from '../shared';

function ContextDashboard() {
  const { state } = useGame();
  const ch = state.gameData.character;
  return (
    <div>
      <h3>Campaign Overview</h3>
      <div className="card">
        <h4>EP Progress</h4>
        <StatBar label={`Level ${ch.level} → ${ch.level+1}`} current={ch.ep.current} max={ch.ep.max} type="xp" />
        <div style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:4,fontFamily:"'Fira Code',monospace"}}>
          {ch.ep.max - ch.ep.current} EP to next level
        </div>
      </div>
      <div className="card">
        <h4>Active Threats</h4>
        <div style={{fontSize:'0.78rem',color:'var(--silver)',lineHeight:1.6}}>
          {state.gameData.combat.active && <div style={{color:'var(--amber)',marginBottom:4}}>⚔ Combat Active</div>}
          <div style={{color:'var(--arcane-bright)'}}>👁 World Awareness: Elevated</div>
        </div>
      </div>
      <div className="card">
        <h4>Hidden Tracker Hints</h4>
        <div style={{fontSize:'0.75rem',lineHeight:1.6}}>
          {Object.values(state.gameData.hiddenTrackers).map((t, i) => (
            <div key={i} style={{color:'var(--silver)',fontStyle:'italic',marginBottom:4}}>"{t.hint}"</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContextDashboard;
