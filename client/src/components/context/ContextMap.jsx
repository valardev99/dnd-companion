import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function ContextMap() {
  const { state } = useGame();
  const sel = state.selected.map;
  const loc = state.gameData.mapLocations.find(l => l.id === sel);

  if (!loc) return (
    <div>
      <h3>Location Details</h3>
      <div className="card"><p style={{color:'var(--muted)',fontSize:'0.8rem'}}>Select a location on the map</p></div>
    </div>
  );

  const dangerColors = { low: 'var(--emerald-bright)', medium: 'var(--amber)', high: 'var(--crimson-bright)', extreme: 'var(--crimson-glow)', unknown: 'var(--muted)' };
  return (
    <div>
      <h3>Location Details</h3>
      <div className="card">
        <div style={{fontSize:'1.5rem',textAlign:'center',marginBottom:8}}>{loc.icon}</div>
        <h4 style={{textAlign:'center'}}>{loc.status === 'unexplored' ? '???' : loc.name}</h4>
        <div style={{textAlign:'center',marginTop:4}}><span style={{fontSize:'0.7rem',color:dangerColors[loc.danger]}}>Danger: {loc.danger.toUpperCase()}</span></div>
        <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.6,marginTop:10}}>{loc.desc}</p>
        {loc.note && <p style={{fontSize:'0.78rem',color:'var(--amber)',fontStyle:'italic',marginTop:8}}>{loc.note}</p>}
      </div>
    </div>
  );
}

export default ContextMap;
