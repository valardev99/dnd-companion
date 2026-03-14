import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { StatBar } from '../shared';

function CombatPanel() {
  const { state, dispatch } = useGame();
  const combat = state.gameData.combat;

  if (!combat.active) {
    return (
      <div>
        <div className="section-header">
          <h1 className="section-title"><span className="icon">⚔️</span> Combat Tracker</h1>
        </div>
        <div className="card"><p style={{color:'var(--muted)',fontSize:'0.85rem',textAlign:'center',padding:20}}>No active combat. Combat is managed through your conversation with the DM.</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">⚔️</span> Combat — Round {combat.round}</h1>
        <span style={{fontFamily:"'Fira Code',monospace",fontSize:'0.75rem',color:'var(--amber)'}}>⚔ ACTIVE</span>
      </div>
      <p style={{fontSize:'0.78rem',color:'var(--muted)',marginBottom:16}}>{combat.location}</p>

      <div className="combat-grid">
        <div>
          <h3 style={{fontSize:'0.85rem',marginBottom:10}}>Turn Order</h3>
          <div className="turn-order">
            {(combat.turnOrder||[]).map((t, i) => (
              <div key={i} className={`turn-entry ${t.type === 'player' ? 'player' : 'enemy'} ${state.combatTurn === i ? 'current' : ''}`}>
                <span className="turn-init">{t.initiative}</span>
                <span className="turn-name" style={{color: t.type === 'player' ? 'var(--frost)' : 'var(--crimson-bright)'}}>
                  {state.combatTurn === i && '▶ '}{t.name}
                </span>
                <span className="turn-hp" style={{color: t.hp < t.maxHp * 0.3 ? 'var(--crimson-bright)' : t.hp < t.maxHp * 0.6 ? 'var(--amber)' : 'var(--emerald-bright)'}}>
                  {t.hp}/{t.maxHp}
                </span>
              </div>
            ))}
          </div>
          <p style={{marginTop:12,fontSize:'0.7rem',color:'var(--muted)',textAlign:'center',fontStyle:'italic'}}>Turn order is managed by the DM</p>
        </div>
        <div>
          <h3 style={{fontSize:'0.85rem',marginBottom:10}}>Combat Log</h3>
          <div className="combat-log">
            {(combat.log||[]).map((entry, i) => (
              <div key={i} className={`log-entry ${entry.type}`}>{entry.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CombatPanel;
