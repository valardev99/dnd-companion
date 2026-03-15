import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { id: 'campaigns', icon: '\u2694\uFE0F', label: 'Campaigns' },
  { id: 'friends', icon: '\uD83D\uDEE1\uFE0F', label: 'Allies' },
  { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
];

export default function HubNav({ activeView, onNavigate }) {
  const { logout } = useAuth();

  return (
    <nav className="hub-nav">
      <div className="hub-nav-logo">
        <div className="hub-nav-logo-icon">W</div>
        <div className="hub-nav-logo-text">Wanderlore</div>
      </div>

      <div className="hub-nav-divider" />

      <ul className="hub-nav-items">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              className={`hub-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className="hub-nav-item-icon">{item.icon}</span>
              <span className="hub-nav-item-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hub-nav-spacer" />

      <div className="hub-nav-bottom">
        <button className="hub-nav-item hub-nav-logout" onClick={logout} title="Sign Out">
          <span className="hub-nav-item-icon">🚪</span>
          <span className="hub-nav-item-label">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
