import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function QuestEntry({ quest, selected, onClick }) {
  const statusClass = quest.type === 'main' ? 'main-quest' : quest.status;
  return (
    <div className={`quest-entry ${statusClass} ${selected?'selected':''}`} onClick={onClick}>
      <div className="quest-title" style={{color: quest.status==='failed'?'var(--crimson-bright)':'var(--gold)'}}>{quest.title}</div>
      <div className="quest-desc">{quest.desc}</div>
      {quest.progress !== undefined && quest.status !== 'failed' && (
        <div className="progress-container" style={{marginBottom:8}}>
          <div className="progress-bar"><div className="progress-fill" style={{width:`${quest.progress}%`}} /></div>
          <span className="progress-text">{quest.progress}%</span>
        </div>
      )}
      {quest.milestones && (
        <div style={{fontSize:'0.72rem',color:'var(--muted)',marginBottom:6}}>
          {quest.milestones.map((m,i) => (
            <div key={i} style={{padding:'1px 0',color: m.includes('✓') ? 'var(--emerald-bright)' : m.includes('FAILED') ? 'var(--crimson-bright)' : 'var(--muted)'}}>
              {m.includes('✓') ? '✓' : m.includes('FAILED') ? '✗' : '○'} {m}
            </div>
          ))}
        </div>
      )}
      <div className="quest-meta">
        {quest.giver && <span>From: {quest.giver}</span>}
        {quest.deadline && <span style={{color:'var(--amber)'}}>⏰ {quest.deadline}</span>}
      </div>
      {quest.consequence && (
        <div style={{marginTop:8,padding:'8px 10px',background:'rgba(198,40,40,0.08)',borderRadius:4,fontSize:'0.75rem',color:'var(--crimson-bright)',border:'1px solid rgba(198,40,40,0.2)'}}>
          ⚠ Consequence: {quest.consequence}
        </div>
      )}
    </div>
  );
}

function QuestPanel() {
  const { state, dispatch } = useGame();
  const sel = state.selected.quest;
  const quests = state.gameData.quests;

  const groups = [
    { label: 'Main Quest', type: 'main', icon: '👑' },
    { label: 'Active', type: 'active', icon: '🔥' },
    { label: 'Completed', type: 'completed', icon: '✅' },
    { label: 'Rumored', type: 'rumored', icon: '❓' },
    { label: 'Failed', type: 'failed', icon: '💀' },
  ];

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">📜</span> Quest Tracker</h1>
        <span className="section-count">{quests.filter(q=>q.status==='active').length} active</span>
      </div>

      {groups.map(g => {
        let filtered;
        if (g.type === 'main') {
          filtered = quests.filter(q => q.type === 'main' && q.status !== 'completed' && q.status !== 'failed');
        } else if (g.type === 'active') {
          filtered = quests.filter(q => q.type !== 'main' && q.status === 'active');
        } else if (g.type === 'completed') {
          filtered = quests.filter(q => q.status === 'completed');
        } else if (g.type === 'failed') {
          filtered = quests.filter(q => q.status === 'failed');
        } else {
          filtered = quests.filter(q => q.type === g.type || q.status === g.type);
        }
        if (filtered.length === 0) return null;
        return (
          <div key={g.type} style={{marginBottom:20}}>
            <h3 style={{fontSize:'0.85rem',color:'var(--silver)',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
              {g.icon} {g.label}
            </h3>
            {filtered.map(q => (
              <QuestEntry key={q.id} quest={q} selected={sel===q.id}
                onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'quest', payload: q.id })} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default QuestPanel;
