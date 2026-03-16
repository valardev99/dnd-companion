import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { PANELS } from '../../data/panels.js';
import GAME_ICONS from '../shared/GameIcons.jsx';

export default function Sidebar({ onMobilePanelSelect, mobilePanelOpen, onToggleCompanion, isTablet, onOpenCampaignPicker }) {
  const { state, dispatch } = useGame();

  const handleClick = (panelId) => {
    dispatch({ type: 'SET_PANEL', payload: panelId });
    if (onMobilePanelSelect && window.innerWidth < 768) {
      onMobilePanelSelect(panelId);
    } else if (onToggleCompanion && isTablet) {
      onToggleCompanion();
    }
  };

  return (
    <div className="icon-sidebar" role="navigation" aria-label="Panel navigation">
      {/* Campaign switcher — visible only on mobile via CSS */}
      <button
        className="icon-sidebar-btn mobile-campaign-btn"
        onClick={onOpenCampaignPicker}
        data-tooltip="Campaigns"
        aria-label="Campaigns"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {PANELS.map(panel => {
        const Icon = GAME_ICONS[panel.id];
        const isActive = state.activePanel === panel.id;
        return (
          <button
            key={panel.id}
            className={`icon-sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(panel.id)}
            data-tooltip={panel.label}
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
