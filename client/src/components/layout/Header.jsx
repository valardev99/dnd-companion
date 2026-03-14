import React from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext.jsx';

function Header() {
  const { state } = useGame();
  const c = state.gameData.campaign;
  const ch = state.gameData.character;
  return (
    <header className="app-header">
      <Link to="/" className="header-home" title="Back to Home" style={{
        color: 'var(--gold)', textDecoration: 'none', fontSize: '1.1rem', marginRight: 8,
        opacity: 0.7, transition: 'opacity 0.2s',
      }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.7}>
        ⟵
      </Link>
      <div className="header-title">{c.name}</div>
      <div className="header-divider" />
      <div className="header-stat">
        <span className="label">Session</span>
        <span className="value">{c.session}</span>
      </div>
      <div className="header-stat">
        <span className="label">Day</span>
        <span className="value">{c.day}</span>
      </div>
      <div className="header-stat">
        <span className="label">Time</span>
        <span className="value">{c.time}</span>
      </div>
      <div className="header-divider" />
      <div className="header-stat">
        <span className="label">Level</span>
        <span className="value">{ch.level}</span>
      </div>
      <div className="header-stat">
        <span className="label">HP</span>
        <span className="value" style={{color: ch.hp.current < ch.hp.max * 0.5 ? 'var(--crimson-bright)' : 'var(--parchment)'}}>{ch.hp.current}/{ch.hp.max}</span>
      </div>
    </header>
  );
}

export default Header;
