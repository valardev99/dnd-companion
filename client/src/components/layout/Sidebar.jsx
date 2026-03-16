import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { PANELS } from '../../data/panels.js';
import GAME_ICONS from '../shared/GameIcons.jsx';

export default function Sidebar({ onMobilePanelSelect, mobilePanelOpen }) {
  const { state, dispatch } = useGame();

  const handleClick = (panelId) => {
    dispatch({ type: 'SET_PANEL', payload: panelId });
    // On mobile, also trigger full-screen panel
    if (onMobilePanelSelect) {
      onMobilePanelSelect(panelId);
    }
  };

  return (
    <div className="icon-sidebar" role="navigation" aria-label="Panel navigation">
      {PANELS.map(panel => {
        const Icon = GAME_ICONS[panel.id];
        const isActive = state.activePanel === panel.id;
        return (
          <button
            key={panel.id}
            className={`icon-sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(panel.id)}
            title={panel.label}
            aria-label={panel.label}
            aria-current={isActive ? 'true' : undefined}
          >
            {Icon ? <Icon /> : panel.icon}
          </button>
        );
      })}
    </div>
  );
}
