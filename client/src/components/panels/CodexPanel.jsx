import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function CodexPanel() {
  const { state, dispatch } = useGame();
  const activeCategory = state.tabs.codex || 'Geography';
  const sel = state.selected.codex;
  const lore = state.gameData.lore;

  const catIcons = { Geography: '🌍', Factions: '⚔️', Magic: '✨', Bestiary: '🐉', History: '📜', Pantheon: '🌟' };
  const entries = lore.entries.filter(e => e.category === activeCategory);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">📖</span> Lore Codex</h1>
        <span className="section-count">{lore.entries.filter(e=>e.discovered).length} discovered</span>
      </div>

      <div className="two-col">
        <div className="codex-sidebar">
          {lore.categories.map(cat => (
            <div key={cat} className={`codex-category ${activeCategory===cat?'active':''}`}
              onClick={() => dispatch({ type: 'SET_TAB', panel: 'codex', payload: cat })}>
              <span>{catIcons[cat]}</span><span>{cat}</span>
              <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'var(--muted)'}}>
                {lore.entries.filter(e=>e.category===cat && e.discovered).length}
              </span>
            </div>
          ))}
        </div>

        <div>
          {entries.map((entry, i) => (
            <div key={i} className={`codex-entry ${sel===entry.title?'selected':''}`}
              onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'codex', payload: entry.title })}
              style={{borderColor: sel===entry.title ? 'var(--gold)' : undefined}}>
              <h3 style={{fontSize:'0.95rem',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                {entry.title}
                {!entry.discovered && <span style={{fontSize:'0.65rem',color:'var(--crimson-bright)'}}>🔒 UNDISCOVERED</span>}
              </h3>
              <div className="codex-content">
                <p>{entry.content}</p>
                {entry.note && <p style={{color:'var(--amber)',fontStyle:'italic',fontSize:'0.8rem',marginTop:8}}>Note: {entry.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CodexPanel;
