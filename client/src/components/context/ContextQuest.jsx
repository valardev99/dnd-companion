import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function ContextQuest() {
  const { state } = useGame();
  const sel = state.selected.quest;
  const quest = state.gameData.quests.find(q => q.id === sel);

  if (!quest) return (
    <div>
      <h3>Quest Details</h3>
      <div className="card"><p style={{color:'var(--muted)',fontSize:'0.8rem'}}>Select a quest to view details</p></div>
    </div>
  );

  return (
    <div>
      <h3>Quest Details</h3>
      <div className="card">
        <h4>{quest.title}</h4>
        <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.6,marginTop:8}}>{quest.desc}</p>
        {quest.deadline && <div style={{marginTop:8,color:'var(--amber)',fontSize:'0.78rem'}}>⏰ Deadline: {quest.deadline}</div>}
        <div style={{marginTop:8,fontSize:'0.75rem',color:'var(--muted)'}}>Given by: {quest.giver}</div>
      </div>
    </div>
  );
}

export default ContextQuest;
