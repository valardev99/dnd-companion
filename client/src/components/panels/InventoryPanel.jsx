import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { Badge } from '../shared';

function InventoryPanel() {
  const { state, dispatch } = useGame();
  const tab = state.tabs.inventory || 'equipped';
  const sel = state.selected.inventory;
  const inv = state.gameData.inventory;
  const categories = { equipped: inv.equipped, consumables: inv.consumables, keyItems: inv.keyItems, materials: inv.materials };
  const items = categories[tab] || [];

  const rarityColors = {
    common: 'var(--rarity-common)', uncommon: 'var(--rarity-uncommon)', rare: 'var(--rarity-rare)',
    epic: 'var(--rarity-epic)', legendary: 'var(--rarity-legendary)', artifact: 'var(--rarity-artifact)',
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">🎒</span> Inventory</h1>
        <div style={{display:'flex',gap:12,fontSize:'0.75rem',fontFamily:"'Fira Code',monospace"}}>
          <span style={{color:'var(--gold)'}}>💰 {state.gameData.character.gold}g</span>
          <span style={{color: state.gameData.character.weight.current > state.gameData.character.weight.max * 0.8 ? 'var(--amber)' : 'var(--silver)'}}>
            ⚖ {state.gameData.character.weight.current}/{state.gameData.character.weight.max}
          </span>
        </div>
      </div>

      <div className="tab-bar">
        {[['equipped','Equipped'],['consumables','Consumables'],['keyItems','Key Items'],['materials','Materials']].map(([k,l]) => (
          <div key={k} className={`tab-item ${tab===k?'active':''}`}
            onClick={() => dispatch({ type: 'SET_TAB', panel: 'inventory', payload: k })}
          >{l} <span style={{color:'var(--muted)',fontSize:'0.7rem'}}>({(categories[k]||[]).length})</span></div>
        ))}
      </div>

      {items.map((item, i) => (
        <div key={i} className={`item-row ${sel === i ? 'selected' : ''}`}
          onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'inventory', payload: i })}>
          <div className="item-icon" style={{ background: `${rarityColors[item.rarity]}15`, borderColor: `${rarityColors[item.rarity]}50`, color: rarityColors[item.rarity] }}>{item.icon}</div>
          <div className="item-info">
            <div className="item-name" style={{ color: rarityColors[item.rarity] }}>{item.name}</div>
            <div className="item-desc">{item.desc}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
            <Badge rarity={item.rarity}>{item.rarity}</Badge>
            {item.qty && <span className="item-qty">x{item.qty}</span>}
            {item.slot && <span style={{fontSize:'0.65rem',color:'var(--muted)'}}>{item.slot}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default InventoryPanel;
