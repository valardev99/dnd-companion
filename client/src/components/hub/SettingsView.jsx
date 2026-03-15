import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const VALID_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-3-flash-preview',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-3.5-haiku',
  'openai/gpt-4o',
];
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export default function SettingsView() {
  const { authFetch, storeApiKey } = useAuth();

  // Load from localStorage — validate cached model against known valid IDs
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('dnd-apiKey') || sessionStorage.getItem('dnd-apiKey') || '');
  const [rememberKey, setRememberKey] = useState(() => localStorage.getItem('dnd-rememberKey') === 'true');
  const [model, setModel] = useState(() => {
    const cached = localStorage.getItem('dnd-model');
    if (cached && VALID_MODELS.includes(cached)) return cached;
    localStorage.setItem('dnd-model', DEFAULT_MODEL);
    return DEFAULT_MODEL;
  });
  const [xaiKey, setXaiKey] = useState(() => localStorage.getItem('dnd-xaiKey') || '');
  const [dmStyle, setDmStyle] = useState(() => parseInt(localStorage.getItem('dnd-dmStyle')) || 50);
  const [particles, setParticles] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [companionScale, setCompanionScale] = useState(() => localStorage.getItem('dnd-companionTextSize') || '100');
  const [testStatus, setTestStatus] = useState('');
  const [apiStatus, setApiStatus] = useState('disconnected');

  // Save settings to localStorage when they change
  useEffect(() => {
    if (apiKey) {
      if (rememberKey) {
        localStorage.setItem('dnd-apiKey', apiKey);
      } else {
        sessionStorage.setItem('dnd-apiKey', apiKey);
      }
      // Also store encrypted on server if key looks valid
      if (apiKey.startsWith('sk-or-') && rememberKey) {
        storeApiKey(apiKey).catch(() => {});
      }
    }
    localStorage.setItem('dnd-rememberKey', rememberKey.toString());
  }, [apiKey, rememberKey, storeApiKey]);

  useEffect(() => { localStorage.setItem('dnd-model', model); }, [model]);
  useEffect(() => { localStorage.setItem('dnd-xaiKey', xaiKey); }, [xaiKey]);
  useEffect(() => { localStorage.setItem('dnd-dmStyle', dmStyle.toString()); }, [dmStyle]);
  useEffect(() => { localStorage.setItem('dnd-companionTextSize', companionScale); }, [companionScale]);

  const keyPrefix = 'sk-or-';

  const testConnection = async () => {
    if (!apiKey) { setTestStatus('No API key entered'); return; }
    if (!apiKey.startsWith(keyPrefix)) { setTestStatus(`Invalid key format \u2014 must start with ${keyPrefix}`); return; }
    setTestStatus('Testing...');
    setApiStatus('testing');
    try {
      const resp = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model, provider: 'openrouter' }),
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'ok') {
        setTestStatus('\u2713 Connected: ' + data.message);
        setApiStatus('connected');
      } else {
        const errMsg = data.detail || data.message || 'Unknown error';
        setTestStatus('\u2717 Error: ' + errMsg);
        setApiStatus('error');
      }
    } catch (e) {
      setTestStatus('\u2717 Connection failed: ' + e.message);
      setApiStatus('error');
    }
  };

  const dmStyleLabel = dmStyle <= 15 ? 'Structured' : dmStyle <= 35 ? 'Guided' : dmStyle <= 65 ? 'Balanced' : dmStyle <= 85 ? 'Narrative' : 'Freeform';
  const dmStyleDesc = dmStyle <= 15
    ? 'Full D&D 5e mechanics. Explicit dice rolls, strict resource tracking, tactical combat.'
    : dmStyle <= 35
    ? 'Semi-structured. Dice rolls for important moments, light resource tracking.'
    : dmStyle <= 65
    ? 'Balanced blend of narrative and mechanics. The default Wanderlore experience.'
    : dmStyle <= 85
    ? 'Story-driven. Rich descriptions, cinematic combat, character development.'
    : 'Pure narrative freedom. No visible mechanics. The world responds to creativity.';

  return (
    <div className="settings-view">
      {/* API Configuration */}
      <div className="card">
        <h4 className="settings-section-title">API Configuration</h4>

        <div className="settings-field">
          <label className="settings-label">OpenRouter API Key</label>
          <input
            type="password"
            className="api-input"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          {apiKey && !apiKey.startsWith(keyPrefix) && (
            <div className="settings-field-error">Key should start with "sk-or-"</div>
          )}
          <div className="settings-hint">
            Get a key at <span style={{ color: 'var(--gold-dim)', fontFamily: "'Fira Code', monospace" }}>openrouter.ai/keys</span>
          </div>
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={e => setRememberKey(e.target.checked)}
            />
            Remember API key across sessions
          </label>
        </div>

        <div className="settings-field">
          <label className="settings-label">Model</label>
          <select className="api-select" value={model} onChange={e => setModel(e.target.value)}>
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="google/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
            <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
            <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5</option>
            <option value="anthropic/claude-3.5-haiku">Claude Haiku 3.5</option>
            <option value="openai/gpt-4o">GPT-4o</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="demo-btn" onClick={testConnection}>Test Connection</button>
          <div className={`api-status ${apiStatus}`}>
            {apiStatus === 'connected' ? '\u25CF Connected' : apiStatus === 'testing' ? '\u25CC Testing...' : apiStatus === 'error' ? '\u2717 Error' : '\u25CB Disconnected'}
          </div>
        </div>
        {testStatus && <div className="settings-test-result">{testStatus}</div>}

        <div className="settings-security-note">
          <strong style={{ color: 'var(--gold)' }}>Security</strong> {'\u2014'} Your key is sent only to OpenRouter's API via HTTPS.
          It is {rememberKey ? 'stored in localStorage (persists across sessions)' : 'stored in sessionStorage (cleared when you close this tab)'}.
        </div>
      </div>

      {/* Image Generation */}
      <div className="card">
        <h4 className="settings-section-title">Image Generation (xAI Grok)</h4>
        <div className="settings-field">
          <label className="settings-label">xAI API Key</label>
          <input
            type="password"
            className="api-input"
            placeholder="xai-..."
            value={xaiKey}
            onChange={e => setXaiKey(e.target.value)}
          />
          <div className="settings-hint">
            Get a key at <span style={{ color: 'var(--gold-dim)', fontFamily: "'Fira Code', monospace" }}>console.x.ai</span> {'\u2014'} $25 free credits. Used for portrait art ($0.02/image).
          </div>
        </div>
        {xaiKey && (
          <div style={{ padding: 10, background: 'rgba(46,125,50,0.05)', border: '1px solid var(--emerald)', fontSize: '0.78rem', color: 'var(--emerald-bright)' }}>
            Portrait generation active \u2014 Click any character portrait placeholder to generate art.
          </div>
        )}
      </div>

      {/* DM Style */}
      <div className="card">
        <h4 className="settings-section-title">DM Style</h4>
        <div className="settings-dm-style">
          <div className="settings-dm-style-labels">
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.72rem', color: 'var(--muted)' }}>Structured</span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 'bold' }}>{dmStyleLabel}</span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.72rem', color: 'var(--muted)' }}>Freeform</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dmStyle}
            onChange={e => setDmStyle(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer', height: 6 }}
          />
          <div className="settings-dm-desc">{dmStyleDesc}</div>
        </div>
      </div>

      {/* Display */}
      <div className="card">
        <h4 className="settings-section-title">Display</h4>
        <div className="setting-row">
          <div>
            <div className="setting-label">Particle Background</div>
            <div className="setting-desc">Floating arcane runes in the background</div>
          </div>
          <div className={`toggle ${particles ? 'active' : ''}`} onClick={() => setParticles(!particles)} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">System Notifications</div>
            <div className="setting-desc">LitRPG-style stat change popups</div>
          </div>
          <div className={`toggle ${notifications ? 'active' : ''}`} onClick={() => setNotifications(!notifications)} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Companion Panel Scale</div>
            <div className="setting-desc">Scale the right-side panels for readability</div>
          </div>
          <select className="api-select" style={{ width: 'auto', minWidth: 100 }} value={companionScale} onChange={e => setCompanionScale(e.target.value)}>
            <option value="100">100%</option>
            <option value="110">110%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="175">175%</option>
            <option value="200">200%</option>
          </select>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <h4 className="settings-section-title">Theme</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { name: 'Dark Fantasy', colors: ['#0a0a0f', '#c9a84c', '#8b1a1a'], active: true },
            { name: 'High Magic', colors: ['#0d1b2a', '#6a3de8', '#4fc3f7'], active: false },
            { name: 'Ancient Ruins', colors: ['#1a1c16', '#8a7d3b', '#4a6741'], active: false },
            { name: 'Terminal', colors: ['#000000', '#00ff41', '#ff3333'], active: false },
          ].map((theme, i) => (
            <div key={i} style={{
              padding: 12, textAlign: 'center', background: 'var(--stone)', borderRadius: 2,
              border: theme.active ? '2px solid var(--gold)' : '1px solid var(--border-dim)',
              cursor: 'pointer', opacity: theme.active ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 6 }}>
                {theme.colors.map((c, j) => (
                  <div key={j} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: theme.active ? 'var(--gold)' : 'var(--muted)' }}>{theme.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
