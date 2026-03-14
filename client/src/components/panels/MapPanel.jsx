import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function MapPanel() {
  const { state, dispatch } = useGame();
  const sel = state.selected.map;
  const locs = state.gameData.mapLocations;
  const paths = state.gameData.mapPaths;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">🗺</span> {state.gameData.campaign.name}</h1>
        <span className="section-count">{locs.filter(l=>l.status!=='unexplored').length}/{locs.length} discovered</span>
      </div>

      <div className="map-container" style={{height:480}}>
        {paths.map((path, i) => {
          const from = locs.find(l => l.id === path.from);
          const to = locs.find(l => l.id === path.to);
          if (!from || !to) return null;
          const x1 = from.x * 5.4 + 28, y1 = from.y * 4.3 + 28;
          const x2 = to.x * 5.4 + 28, y2 = to.y * 4.3 + 28;
          const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
          const angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
          return <div key={i} className={`map-path ${path.traveled ? 'traveled' : ''}`} style={{left:x1,top:y1,width:len,transform:`rotate(${angle}deg)`}} />;
        })}
        {locs.map(loc => (
          <div key={loc.id}
            className={`map-node ${loc.status} ${loc.danger==='high'||loc.danger==='extreme' ? 'dangerous' : ''}`}
            style={{ left: `${loc.x * 5.4}px`, top: `${loc.y * 4.3}px` }}
            onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'map', payload: loc.id })}
          >
            {loc.status === 'unexplored' ? '❓' : loc.icon}
            <span className="map-node-label">{loc.status === 'unexplored' ? '???' : loc.name}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:16,marginTop:12,fontSize:'0.7rem',color:'var(--muted)'}}>
        <span>🟡 Current</span><span>⚪ Explored</span><span>❓ Unexplored</span><span style={{color:'var(--crimson-bright)'}}>🔴 Dangerous</span>
      </div>
    </div>
  );
}

export default MapPanel;
