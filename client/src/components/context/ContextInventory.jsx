import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { Badge } from '../shared';

function ContextInventory() {
  const { state } = useGame();
  const tab = state.tabs.inventory || 'equipped';
  const sel = state.selected.inventory;
  const inv = state.gameData.inventory;
  const cats = { equipped: inv.equipped, consumables: inv.consumables, keyItems: inv.keyItems, materials: inv.materials };
  const items = cats[tab] || [];
  const item = sel !== null ? items[sel] : null;

  if (!item) return (
    <div>
      <h3>Item Details</h3>
      <div className="card"><p style={{color:'var(--muted)',fontSize:'0.8rem'}}>Select an item to view details</p></div>
    </div>
  );

  return (
    <div>
      <h3>Item Details</h3>
      <div className="card">
        <div style={{textAlign:'center',marginBottom:12}}><span style={{fontSize:'2.5rem'}}>{item.icon}</span></div>
        <h4 style={{textAlign:'center',marginBottom:4}}>{item.name}</h4>
        <div style={{textAlign:'center',marginBottom:12}}><Badge rarity={item.rarity}>{item.rarity}</Badge></div>
        <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.6,fontStyle:'italic'}}>{item.desc}</p>
        {item.slot && <div style={{marginTop:8,fontSize:'0.75rem',color:'var(--muted)'}}>Slot: {item.slot}</div>}
        {item.weight > 0 && <div style={{fontSize:'0.75rem',color:'var(--muted)'}}>Weight: {item.weight}</div>}
        {item.qty && <div style={{fontSize:'0.75rem',color:'var(--muted)'}}>Quantity: {item.qty}</div>}
      </div>
    </div>
  );
}

export default ContextInventory;
