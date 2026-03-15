import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function SettingsPanel() {
  const { state, dispatch } = useGame();

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">⚙️</span> Settings</h1>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: 12 }}>Display</h4>
        <div className="setting-row">
          <div>
            <div className="setting-label">Chat Text Size</div>
            <div className="setting-desc">Adjust DM response text size</div>
          </div>
          <select className="api-select" style={{ width: 'auto', minWidth: 100 }} value={state.chatTextSize || 'medium'} onChange={e => {
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

      <div className="card" style={{ textAlign: 'center' }}>
        <a href="/play" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '0.88rem',
          fontWeight: 600,
          color: 'var(--gold)',
          textDecoration: 'none',
          display: 'inline-block',
          padding: '10px 24px',
          border: '1px solid var(--gold-dim)',
          transition: 'all 0.2s',
          letterSpacing: '0.5px',
        }}>
          Return to Command Center
        </a>
      </div>
    </div>
  );
}

export default SettingsPanel;
