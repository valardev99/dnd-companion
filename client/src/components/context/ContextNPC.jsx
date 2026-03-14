import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { Stars } from '../shared';

function ContextNPC() {
  const { state } = useGame();
  const sel = state.selected.npc;
  const npc = state.gameData.npcs.find(n => n.name === sel);

  if (!npc) return (
    <div>
      <h3>NPC Profile</h3>
      <div className="card"><p style={{color:'var(--muted)',fontSize:'0.8rem'}}>Select an NPC to view profile</p></div>
    </div>
  );

  return (
    <div>
      <h3>NPC Profile</h3>
      <div className="card">
        <div style={{textAlign:'center',marginBottom:8}}>
          <div className={`npc-avatar ${npc.relationship}`} style={{margin:'0 auto',width:56,height:56,fontSize:'1.8rem'}}>{npc.avatar}</div>
        </div>
        <h4 style={{textAlign:'center'}}>{npc.name}</h4>
        <div style={{textAlign:'center',fontSize:'0.78rem',color:'var(--muted)',marginBottom:8}}>{npc.role}</div>
        <div style={{textAlign:'center',marginBottom:12}}><Stars count={npc.stars} /></div>
        <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.6}}>{npc.desc}</p>
        <div style={{marginTop:10,padding:'8px',background:'var(--obsidian)',borderRadius:4,fontSize:'0.75rem'}}>
          <div style={{color:'var(--muted)',marginBottom:4}}>Motivation:</div>
          <div style={{color:'var(--parchment)'}}>{npc.motivation}</div>
        </div>
        <div style={{marginTop:6,fontSize:'0.75rem',color:'var(--muted)'}}>Location: <span style={{color:'var(--parchment)'}}>{npc.location}</span></div>
        <div style={{marginTop:4,fontSize:'0.75rem',color:'var(--muted)'}}>Loyalty: <span style={{color:'var(--gold)'}}>{npc.loyalty}/10</span></div>
      </div>
    </div>
  );
}

export default ContextNPC;
