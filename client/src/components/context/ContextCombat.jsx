import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { StatBar } from '../shared';

function ContextCombat() {
  const { state } = useGame();
  const combat = state.gameData.combat;
  if (!combat.active || !combat.turnOrder || combat.turnOrder.length === 0) {
    return <div><h3>Combat Info</h3><div className="card"><p style={{color:'var(--muted)',fontSize:'0.8rem'}}>No active combat</p></div></div>;
  }
  const current = combat.turnOrder[state.combatTurn] || combat.turnOrder[0];

  return (
    <div>
      <h3>Combat Info</h3>
      <div className="card">
        <h4>Current: {current.name}</h4>
        <StatBar label="HP" current={current.hp} max={current.maxHp} type="hp" />
        <div style={{fontSize:'0.75rem',color:'var(--muted)',marginTop:4}}>AC: {current.ac}</div>
        {current.conditions && current.conditions.length > 0 && (
          <div style={{marginTop:6}}>{current.conditions.map((c,i) => <span key={i} className="condition-tag buff">{c}</span>)}</div>
        )}
        {current.desc && <p style={{fontSize:'0.78rem',color:'var(--silver)',marginTop:8,fontStyle:'italic'}}>{current.desc}</p>}
      </div>
      <div className="card">
        <h4>Battlefield</h4>
        <p style={{fontSize:'0.78rem',color:'var(--silver)',lineHeight:1.5}}>{combat.location}</p>
      </div>
    </div>
  );
}

export default ContextCombat;
