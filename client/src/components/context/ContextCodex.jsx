import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function ContextCodex() {
  const { state } = useGame();
  const lore = state.gameData.lore;
  return (
    <div>
      <h3>Codex Info</h3>
      <div className="card">
        <p style={{fontSize:'0.78rem',color:'var(--silver)',lineHeight:1.6}}>
          Select a lore entry to read its full contents. Entries are unlocked through exploration and discovery.
        </p>
        <div style={{marginTop:8,fontSize:'0.75rem',color:'var(--muted)'}}>
          {lore.entries.filter(e=>e.discovered).length} of {lore.entries.length} entries discovered
        </div>
      </div>
    </div>
  );
}

export default ContextCodex;
