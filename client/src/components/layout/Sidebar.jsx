import React, { useState, useRef } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { PANELS } from '../../data/panels.js';
import GAME_ICONS from '../shared/GameIcons.jsx';

function Sidebar() {
  const { state, dispatch } = useGame();
  const [tooltip, setTooltip] = useState(null);

  const handleMouseEnter = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      right: window.innerWidth - rect.left + 10,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <nav className="center-sidebar">
      {PANELS.map(p => {
        const IconComponent = GAME_ICONS[p.id];
        return (
          <div key={p.id}
            className={`sidebar-item ${state.activePanel === p.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_PANEL', payload: p.id })}
            onMouseEnter={e => handleMouseEnter(e, p.label)}
            onMouseLeave={handleMouseLeave}
          >
            <span className="icon">
              {IconComponent ? <IconComponent size={20} /> : p.icon}
            </span>
          </div>
        );
      })}

      {/* Fixed-position tooltip — escapes overflow clipping */}
      {tooltip && (
        <div
          className="sidebar-tooltip-fixed"
          style={{
            position: 'fixed',
            top: tooltip.top,
            right: tooltip.right,
            transform: 'translateY(-50%)',
            zIndex: 9999,
          }}
        >
          {tooltip.label}
        </div>
      )}
    </nav>
  );
}

export default Sidebar;
