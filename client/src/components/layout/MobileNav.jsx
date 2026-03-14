import React, { useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

const MOBILE_TABS = [
  { id: 'chat', icon: '\u{1F4AC}', label: 'Chat' },
  { id: 'dashboard', icon: '\u{1F3E0}', label: 'Home' },
  { id: 'character', icon: '\u{1F464}', label: 'Character' },
  { id: 'inventory', icon: '\u{1F392}', label: 'Items' },
  { id: 'more', icon: '\u22EF', label: 'More' },
];

const MORE_PANELS = [
  { id: 'quests', icon: '\u{1F4DC}', label: 'Quests' },
  { id: 'npcs', icon: '\u{1F465}', label: 'NPCs' },
  { id: 'combat', icon: '\u2694\uFE0F', label: 'Combat' },
  { id: 'map', icon: '\u{1F5FA}', label: 'Map' },
  { id: 'codex', icon: '\u{1F4D6}', label: 'Codex' },
  { id: 'journal', icon: '\u{1F4D3}', label: 'Journal' },
  { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
];

export default function MobileNav({ activeView, onViewChange }) {
  const { state, dispatch } = useGame();
  const [showMore, setShowMore] = useState(false);

  const handleTab = (id) => {
    if (id === 'more') {
      setShowMore(!showMore);
    } else if (id === 'chat') {
      onViewChange('chat');
      setShowMore(false);
    } else {
      dispatch({ type: 'SET_PANEL', payload: id });
      onViewChange('companion');
      setShowMore(false);
    }
  };

  return (
    <>
      {showMore && (
        <div className="mobile-more-menu open">
          {MORE_PANELS.map(p => (
            <div key={p.id} className="mobile-more-item" onClick={() => handleTab(p.id)}>
              <span className="mobile-more-icon">{p.icon}</span>
              <span className="mobile-more-label">{p.label}</span>
            </div>
          ))}
        </div>
      )}
      <nav className="mobile-nav">
        {MOBILE_TABS.map(tab => (
          <div key={tab.id}
            className={`mobile-nav-item ${
              tab.id === 'chat' && activeView === 'chat' ? 'active' :
              tab.id === 'more' && showMore ? 'active' :
              tab.id !== 'chat' && tab.id !== 'more' && state.activePanel === tab.id && activeView === 'companion' ? 'active' : ''
            }`}
            onClick={() => handleTab(tab.id)}
          >
            <span className="mobile-nav-icon">{tab.icon}</span>
            <span className="mobile-nav-label">{tab.label}</span>
          </div>
        ))}
      </nav>
    </>
  );
}
