import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { StatBar, ConditionTag } from '../shared';

function DashboardPanel() {
  const { state, dispatch } = useGame();
  const c = state.gameData.campaign;
  const ch = state.gameData.character;
  const vc = state.gameData.vitalsConfig || {};
  const mpConfig = vc.mp || { label: 'EP', visible: true };
  const sanConfig = vc.sanity || { label: 'Sanity', visible: true };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">🏛</span> {c.location}</h1>
        <span style={{fontFamily:"'Fira Code',monospace",fontSize:'0.75rem',color:'var(--muted)'}}>Day {c.day} · {c.time}</span>
      </div>

      <div className="card" style={{background:'linear-gradient(135deg, var(--deep-stone), var(--stone))', borderColor:'var(--border-gold)'}}>
        <p style={{fontSize:'0.9rem',lineHeight:1.7,color:'var(--parchment-light)'}}>
          {state.chatMessages.length === 0
            ? `Welcome to ${c.name}. Configure your API key in Settings, then start chatting with your DM to begin the adventure.`
            : `You are at ${c.location}. The mood is ${c.mood}.`
          }
        </p>
        {state.apiStatus !== 'connected' && state.chatMessages.length === 0 && (
          <p style={{fontSize:'0.85rem',marginTop:12,color:'var(--amber)',fontFamily:"'Fira Code',monospace"}}>
            ⚙ Go to Settings → API Configuration to connect
          </p>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:16}}>
        <div className="card">
          <h4 style={{marginBottom:8}}>Vitals</h4>
          <StatBar label="HP" current={ch.hp.current} max={ch.hp.max} type="hp" />
          {mpConfig.visible !== false && <StatBar label={mpConfig.label} current={ch.mp.current} max={ch.mp.max} type="mp" />}
          <StatBar label="XP" current={ch.ep.current} max={ch.ep.max} type="xp" />
          {sanConfig.visible !== false && <StatBar label={sanConfig.label} current={ch.sanity.current} max={ch.sanity.max} type="sanity" />}
        </div>

        <div className="card">
          <h4 style={{marginBottom:8}}>Active Conditions</h4>
          {ch.conditions.length === 0
            ? <p style={{fontSize:'0.75rem',color:'var(--muted)',fontStyle:'italic'}}>No active conditions</p>
            : ch.conditions.map((c,i) => <div key={i} style={{marginBottom:4}}><ConditionTag condition={c} /></div>)
          }
        </div>

        <div className="card">
          <h4 style={{marginBottom:8}}>Quick Stats</h4>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {Object.entries(ch.stats).map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',padding:'4px 0'}}>
                <span style={{color:'var(--muted)',fontFamily:"'Fira Code',monospace",fontSize:'0.7rem'}}>{k}</span>
                <span style={{color:'var(--gold-bright)',fontWeight:700}}>{v.value} {v.trend==='up'?'↑':v.trend==='down'?'↓':'·'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPanel;
