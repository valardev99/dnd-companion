import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { sendChatMessage } from '../../services/chatService.js';

function SettingsPanel() {
  const { state, dispatch } = useGame();
  const [testStatus, setTestStatus] = useState('');
  const [particles, setParticles] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const keyPrefix = 'sk-or-';

  const testConnection = async () => {
    if (!state.apiKey) { setTestStatus('No API key entered'); return; }
    if (!state.apiKey.startsWith(keyPrefix)) { setTestStatus(`Invalid key format — must start with ${keyPrefix}`); return; }
    setTestStatus('Testing...');
    dispatch({ type: 'SET_API_STATUS', payload: 'testing' });
    try {
      const resp = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.apiKey, model: state.model, provider: state.apiProvider || 'openrouter' }),
      });
      const data = await resp.json();
      if (data.status === 'ok') {
        setTestStatus('✓ Connected: ' + data.message);
        dispatch({ type: 'SET_API_STATUS', payload: 'connected' });
        // Auto-navigate to wizard if no world exists yet
        if (!state.worldBible) {
          dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: true });
        }
      } else {
        setTestStatus('✗ Error: ' + data.message);
        dispatch({ type: 'SET_API_STATUS', payload: 'error' });
      }
    } catch(e) {
      setTestStatus('✗ Connection failed: ' + e.message);
      dispatch({ type: 'SET_API_STATUS', payload: 'error' });
    }
  };

  // OpenRouter is the only supported provider

  const clearChat = () => {
    if (confirm('Clear all chat messages? Game state will be preserved.')) {
      dispatch({ type: 'LOAD_GAME_STATE', payload: { chatMessages: [] } });
      localStorage.removeItem('dnd-chat');
    }
  };

  const newCampaign = () => {
    dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: true });
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">⚙️</span> Settings</h1>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>🔑 API Configuration</h4>

        {/* API Key input */}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:'0.78rem',color:'var(--muted)',display:'block',marginBottom:4}}>
            OpenRouter API Key
          </label>
          <input type="password" className="api-input"
            placeholder="sk-or-..."
            value={state.apiKey}
            onChange={e => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
          />
          {state.apiKey && !state.apiKey.startsWith(keyPrefix) && (
            <div style={{fontSize:'0.7rem',color:'var(--crimson-bright)',marginTop:4,fontFamily:"'Fira Code',monospace"}}>
              Key should start with "sk-or-"
            </div>
          )}
          <div style={{fontSize:'0.68rem',color:'var(--muted)',marginTop:6,lineHeight:1.4}}>
            Get a key at <span style={{color:'var(--gold-dim)',fontFamily:"'Fira Code',monospace"}}>openrouter.ai/keys</span>
          </div>
          <label style={{fontSize:'0.72rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:6,marginTop:8,cursor:'pointer'}}>
            <input type="checkbox" checked={state.rememberKey}
              onChange={e => dispatch({ type: 'SET_REMEMBER_KEY', payload: e.target.checked })} />
            Remember API key across sessions
          </label>
        </div>

        {/* Model dropdown */}
        <div style={{marginBottom:12}}>
          <label style={{fontSize:'0.78rem',color:'var(--muted)',display:'block',marginBottom:4}}>Model</label>
          <select className="api-select" value={state.model} onChange={e => dispatch({ type: 'SET_MODEL', payload: e.target.value })}>
            <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
            <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
            <option value="anthropic/claude-opus-4">Claude Opus 4</option>
            <option value="anthropic/claude-haiku-3.5">Claude Haiku 3.5</option>
          </select>
        </div>

        {/* Test connection */}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="demo-btn" onClick={testConnection}>Test Connection</button>
          <div className={`api-status ${state.apiStatus}`}>
            {state.apiStatus === 'connected' ? '● Connected' : state.apiStatus === 'testing' ? '◌ Testing...' : state.apiStatus === 'error' ? '✗ Error' : '○ Disconnected'}
          </div>
        </div>
        {testStatus && <div style={{marginTop:8,fontSize:'0.75rem',color:'var(--silver)',fontFamily:"'Fira Code',monospace"}}>{testStatus}</div>}

        {/* Security note */}
        <div style={{marginTop:12,padding:10,background:'rgba(201,168,76,0.05)',border:'1px solid var(--gold-dim)',borderRadius:4}}>
          <div style={{fontSize:'0.7rem',color:'var(--silver)',lineHeight:1.5}}>
            <strong style={{color:'var(--gold)'}}>🔒 Security</strong> — Your key is sent only to OpenRouter's API via HTTPS.
            It is {state.rememberKey ? 'stored in localStorage (persists across sessions)' : 'stored in sessionStorage (cleared when you close this tab)'}.
            Never logged or sent to third parties.
          </div>
        </div>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>🎨 Image Generation (xAI Grok)</h4>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:'0.78rem',color:'var(--muted)',display:'block',marginBottom:4}}>
            xAI API Key
          </label>
          <input type="password" className="api-input"
            placeholder="xai-..."
            value={state.xaiKey || ''}
            onChange={e => {
              dispatch({ type: 'SET_XAI_KEY', payload: e.target.value });
              localStorage.setItem('dnd-xaiKey', e.target.value);
            }}
          />
          <div style={{fontSize:'0.68rem',color:'var(--muted)',marginTop:6,lineHeight:1.4}}>
            Get a key at <span style={{color:'var(--gold-dim)',fontFamily:"'Fira Code',monospace"}}>console.x.ai</span> — $25 free credits included.
            Used to generate character & NPC portrait art ($0.02/image).
          </div>
        </div>
        {state.xaiKey && (
          <div style={{padding:10,background:'rgba(16,185,129,0.05)',border:'1px solid var(--emerald)',borderRadius:4}}>
            <div style={{fontSize:'0.7rem',color:'var(--emerald-bright)',lineHeight:1.5}}>
              ● Portrait generation active — Click any character portrait placeholder or NPC emoji to generate art.
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>🎭 DM Style</h4>
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:'0.72rem',color:'var(--muted)',fontFamily:"'Fira Code',monospace"}}>⚔ Structured</span>
            <span style={{fontSize:'0.72rem',color:'var(--gold)',fontFamily:"'Fira Code',monospace",fontWeight:'bold'}}>
              {(state.dmStyle || 50) <= 15 ? 'Structured' : (state.dmStyle || 50) <= 35 ? 'Guided' : (state.dmStyle || 50) <= 65 ? 'Balanced' : (state.dmStyle || 50) <= 85 ? 'Narrative' : 'Freeform'}
            </span>
            <span style={{fontSize:'0.72rem',color:'var(--muted)',fontFamily:"'Fira Code',monospace"}}>Freeform 📖</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={state.dmStyle || 50}
            onChange={e => dispatch({ type: 'SET_DM_STYLE', payload: parseInt(e.target.value) })}
            style={{
              width:'100%',
              accentColor:'var(--gold)',
              cursor:'pointer',
              height:6,
            }}
          />
          <div style={{marginTop:8,padding:10,background:'rgba(201,168,76,0.05)',border:'1px solid var(--border-dim)',borderRadius:4}}>
            <div style={{fontSize:'0.7rem',color:'var(--silver)',lineHeight:1.5}}>
              {(state.dmStyle || 50) <= 15
                ? '🎲 Full D&D 5e mechanics. Explicit dice rolls, strict resource tracking, tactical combat. Every number matters.'
                : (state.dmStyle || 50) <= 35
                ? '⚖ Semi-structured. Dice rolls for important moments, light resource tracking. Rules enhance drama.'
                : (state.dmStyle || 50) <= 65
                ? '🌟 Balanced blend of narrative and mechanics. The default Wanderlore experience.'
                : (state.dmStyle || 50) <= 85
                ? '📜 Story-driven. Rich descriptions, cinematic combat, character development over stat optimization.'
                : '✨ Pure narrative freedom. No visible mechanics. The world responds to creativity and intent.'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>Campaign Management</h4>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="demo-btn" onClick={clearChat}>Clear Chat History</button>
          <button className="demo-btn" onClick={newCampaign} style={{borderColor:'var(--crimson)'}}>New Campaign</button>
        </div>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>Display</h4>
        <div className="setting-row">
          <div>
            <div className="setting-label">Particle Background</div>
            <div className="setting-desc">Floating arcane runes in the background</div>
          </div>
          <div className={`toggle ${particles?'active':''}`} onClick={() => setParticles(!particles)} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">System Notifications</div>
            <div className="setting-desc">LitRPG-style stat change popups</div>
          </div>
          <div className={`toggle ${notifications?'active':''}`} onClick={() => setNotifications(!notifications)} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Chat Text Size</div>
            <div className="setting-desc">Adjust DM response text size</div>
          </div>
          <select className="api-select" style={{width:'auto',minWidth:100}} value={state.chatTextSize || 'medium'} onChange={e => {
            dispatch({ type: 'SET_CHAT_TEXT_SIZE', payload: e.target.value });
            localStorage.setItem('dnd-chatTextSize', e.target.value);
          }}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">X-Large</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>Theme</h4>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            { name: 'Dark Fantasy', colors: ['#0a0a0f','#c9a84c','#8b1a1a'], active: true },
            { name: 'High Magic', colors: ['#0d1b2a','#6a3de8','#4fc3f7'], active: false },
            { name: 'Ancient Ruins', colors: ['#1a1c16','#8a7d3b','#4a6741'], active: false },
            { name: 'Terminal', colors: ['#000000','#00ff41','#ff3333'], active: false },
          ].map((theme, i) => (
            <div key={i} style={{
              padding:12,textAlign:'center',background:'var(--stone)',borderRadius:6,
              border: theme.active ? '2px solid var(--gold)' : '1px solid var(--border-dim)',
              cursor:'pointer', opacity: theme.active ? 1 : 0.5,
            }}>
              <div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:6}}>
                {theme.colors.map((c,j) => (
                  <div key={j} style={{width:16,height:16,borderRadius:'50%',background:c,border:'1px solid rgba(255,255,255,0.1)'}} />
                ))}
              </div>
              <div style={{fontSize:'0.7rem',color: theme.active ? 'var(--gold)' : 'var(--muted)'}}>{theme.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4 style={{marginBottom:12}}>About</h4>
        <div style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.6}}>
          <p style={{color:'var(--gold)',fontWeight:'bold'}}>Wanderlore AI</p>
          <p style={{color:'var(--muted)',marginTop:4}}>Campaign Companion — DM Engine V3</p>
          <p style={{color:'var(--muted)',marginTop:4}}>Powered by OpenRouter — AI Dungeon Master</p>
          <p style={{color:'var(--gold-dim)',marginTop:8,fontFamily:"'Fira Code',monospace",fontSize:'0.7rem'}}>v0.3.0 — Enter a world with no rules.</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
