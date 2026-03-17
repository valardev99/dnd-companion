import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

function Footer() {
  const { state } = useGame();
  const c = state.gameData.campaign;
  const hasActiveGame = c.name || c.session > 0;
  return (
    <footer className="app-footer">
      <div className="footer-status">
        <span className={`footer-api-dot ${state.apiStatus}`} />
        <span>{state.apiStatus === 'connected' ? 'API Connected' : state.apiStatus === 'testing' ? 'Testing...' : 'API Disconnected'}</span>
        <span style={{color:'var(--muted)',marginLeft:4}}>· {state.model}</span>
      </div>
      <span>{hasActiveGame ? `${c.name ? c.name + ' · ' : ''}Session ${c.session} · Day ${c.day} · ${c.time}` : 'No Active Campaign'}</span>
      <span style={{fontFamily:"'Cinzel',serif",fontStyle:'italic',color:'var(--gold-dim)',fontSize:'0.75rem'}}>May the rolls be kind to you.</span>
    </footer>
  );
}

export default Footer;
