import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { StatBar, ConditionTag } from '../shared';
import { generatePortraitAsync } from '../../services/imageService.js';

function CharacterPanel() {
  const { state, dispatch } = useGame();
  const tab = state.tabs.character || 'stats';
  const ch = state.gameData.character;
  const vc = state.gameData.vitalsConfig || {};
  const mpConfig = vc.mp || { label: 'EP', fullLabel: 'Essence Points', visible: true };
  const sanConfig = vc.sanity || { label: 'Sanity', fullLabel: 'Sanity', visible: true };
  const [generatingPortrait, setGeneratingPortrait] = useState(false);

  const handleGeneratePortrait = () => {
    const apiKey = state.xaiKey;
    if (!apiKey) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'NO API KEY', body: 'Add your xAI API key in Settings to generate portraits.', style: 'critical' } });
      return;
    }
    setGeneratingPortrait(true);
    generatePortraitAsync({
      apiKey,
      name: ch.name,
      race: ch.race,
      characterClass: ch.class,
      description: ch.assignedBy || '',
    }, dispatch, 'character');
    // Reset after a delay (portrait loads async)
    setTimeout(() => setGeneratingPortrait(false), 8000);
  };

  return (
    <div>
      <div className="section-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Character Portrait */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {ch.image ? (
            <div className="character-portrait" style={{
              width: 80, height: 100, borderRadius: 6,
              border: '2px solid var(--gold-dim)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 0 20px rgba(201,168,76,0.1)',
            }}>
              <img src={ch.image} alt={ch.name} style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
            </div>
          ) : (
            <div style={{
              width: 80, height: 100, borderRadius: 6,
              border: '2px solid var(--border-dim)',
              background: 'var(--stone)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: state.xaiKey ? 'pointer' : 'default',
              opacity: generatingPortrait ? 0.5 : 0.7,
              transition: 'all 0.3s',
            }} onClick={handleGeneratePortrait} title={state.xaiKey ? 'Generate portrait' : 'Add xAI key in Settings'}>
              {generatingPortrait ? (
                <span style={{ fontSize: '0.65rem', color: 'var(--gold-dim)', fontFamily: "'Fira Code',monospace" }}>
                  Creating...
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>🎨</span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--muted)', marginTop: 4, fontFamily: "'Fira Code',monospace" }}>
                    Portrait
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="section-title" style={{ marginBottom: 4 }}>{ch.name}</h1>
          <span style={{fontFamily:"'Fira Code',monospace",fontSize:'0.75rem',color:'var(--muted)'}}>{ch.race} · {ch.class} · Lvl {ch.level}</span>
          <p style={{fontSize:'0.72rem',color:'var(--silver)',marginTop:6,fontStyle:'italic',lineHeight:1.5}}>"{ch.assignedBy}"</p>
        </div>
      </div>

      <div className="tab-bar">
        {['stats','conditions','abilities','traits','trackers'].map(t => (
          <div key={t} className={`tab-item ${tab===t?'active':''}`}
            onClick={() => dispatch({ type: 'SET_TAB', panel: 'character', payload: t })}
          >{t.charAt(0).toUpperCase()+t.slice(1)}</div>
        ))}
      </div>

      {tab === 'stats' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <StatBar label="Hit Points" current={ch.hp.current} max={ch.hp.max} type="hp" />
              {mpConfig.visible !== false && <StatBar label={mpConfig.fullLabel || mpConfig.label} current={ch.mp.current} max={ch.mp.max} type="mp" />}
            </div>
            <div>
              <StatBar label="Experience" current={ch.ep.current} max={ch.ep.max} type="xp" />
              {sanConfig.visible !== false && <StatBar label={sanConfig.fullLabel || sanConfig.label} current={ch.sanity.current} max={ch.sanity.max} type="sanity" />}
            </div>
          </div>
          <div className="stat-grid">
            {Object.entries(ch.stats).map(([name, s]) => (
              <div key={name} className="stat-block">
                <div className="stat-name">{name}</div>
                <div className="stat-value">{s.value}</div>
                <div className={`stat-trend ${s.trend}`}>
                  {s.trend==='up' ? `▲ ${s.prevValue}→${s.value}` : s.trend==='down' ? `▼ ${s.prevValue}→${s.value}` : '— stable'}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:16,marginTop:16,fontSize:'0.8rem'}}>
            <div><span style={{color:'var(--muted)'}}>Gold:</span> <span style={{color:'var(--gold)',fontWeight:600}}>{ch.gold}</span></div>
            <div><span style={{color:'var(--muted)'}}>Weight:</span> <span style={{color: ch.weight.current > ch.weight.max * 0.8 ? 'var(--amber)' : 'var(--parchment)'}}>{ch.weight.current}/{ch.weight.max}</span></div>
          </div>
        </div>
      )}

      {tab === 'conditions' && (
        <div>
          {ch.conditions.length === 0 ? (
            <div className="card" style={{textAlign:'center',padding:24}}>
              <p style={{fontSize:'0.85rem',color:'var(--muted)',fontStyle:'italic'}}>No active conditions</p>
              <p style={{fontSize:'0.7rem',color:'var(--muted)',marginTop:8}}>Conditions will appear as the DM applies them during your adventure</p>
            </div>
          ) : ch.conditions.map((c, i) => (
            <div key={i} className="card" style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:'1.5rem'}}>{c.icon}</span>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontWeight:600,fontSize:'0.9rem'}}>{c.name}</span>
                  <span className={`condition-tag ${c.type==='buff'?'buff':c.type==='debuff'?'debuff':'neutral-tag'}`} style={{margin:0}}>{c.type}</span>
                </div>
                <p style={{fontSize:'0.8rem',color:'var(--silver)',marginTop:4,lineHeight:1.5}}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'abilities' && (
        <div>
          {ch.abilities.map((a, i) => (
            <div key={i} className="ability-card">
              <div className="ability-header">
                <span className="ability-name">{a.name}</span>
                <span className="ability-type">{a.type}</span>
              </div>
              <div className="ability-desc">{a.desc}</div>
              <div className="ability-meta">
                <span>Req: {a.req}</span><span>Cost: {a.cost}</span><span>CD: {a.cooldown}</span><span>Prof: {a.proficiency} ({a.uses} uses)</span>
              </div>
              <div style={{marginTop:6}}>
                <div className="progress-container">
                  <span style={{fontSize:'0.65rem',color:'var(--muted)',minWidth:50}}>{a.proficiency}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${Math.min(100,(a.uses/50)*100)}%`,background:a.proficiency==='Adept'?'var(--emerald)':a.proficiency==='Skilled'?'var(--frost)':'var(--gold-dim)'}} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'traits' && (
        <div>
          {ch.traits.map((t, i) => (
            <div key={i} className="card">
              <h4 style={{marginBottom:4}}>{t.name}</h4>
              <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.5}}>{t.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'trackers' && (
        <div>
          <p style={{fontSize:'0.78rem',color:'var(--muted)',marginBottom:16,fontStyle:'italic'}}>
            These readings are... approximate. The System does not reveal its full calculations.
          </p>
          {Object.entries(state.gameData.hiddenTrackers).map(([key, t]) => (
            <div key={key} className="tracker-mystery">
              <div className="tracker-name">
                <span>{key === 'sanity' ? '🧠' : key === 'worldAwareness' ? '👁' : key === 'corruption' ? '☠️' : key === 'magicalDebt' ? '⚖️' : '🔮'}</span>
                <span style={{textTransform:'capitalize'}}>{key.replace(/([A-Z])/g,' $1').trim()}</span>
              </div>
              <div className="tracker-bar">
                <div className={`tracker-fill ${key === 'sanity' ? 'sanity' : key === 'worldAwareness' ? 'awareness' : key === 'corruption' ? 'corruption' : 'transformation'}`}
                  style={{ width: `${t.value}%` }} />
              </div>
              <div className="tracker-hint">"{t.hint}"</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CharacterPanel;
