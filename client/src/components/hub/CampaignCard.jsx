import React from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CampaignCard({ campaign, onClick, isSelected }) {
  const {
    name,
    character_name,
    character_level,
    world_name,
    last_played,
    status,
    co_player_name,
    is_multiplayer,
  } = campaign;

  return (
    <div
      className={`campaign-card ${isSelected ? 'selected' : ''} ${status === 'in_session' ? 'in-session' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="campaign-card-header">
        <h3 className="campaign-card-name">{name || 'Untitled Campaign'}</h3>
        <span className={`campaign-card-status ${status || 'active'}`}>
          {status === 'in_session' ? 'In Session' : status === 'archived' ? 'Archived' : 'Active'}
        </span>
      </div>

      <div className="campaign-card-details">
        {character_name && (
          <div className="campaign-card-row">
            <span className="campaign-card-label">Character</span>
            <span className="campaign-card-value">
              {character_name}
              {character_level ? ` (Lv ${character_level})` : ''}
            </span>
          </div>
        )}
        {world_name && (
          <div className="campaign-card-row">
            <span className="campaign-card-label">World</span>
            <span className="campaign-card-value">{world_name}</span>
          </div>
        )}
        <div className="campaign-card-row">
          <span className="campaign-card-label">Last Played</span>
          <span className="campaign-card-value">{timeAgo(last_played)}</span>
        </div>
      </div>

      {is_multiplayer && co_player_name && (
        <div className="campaign-card-multiplayer">
          <span className="campaign-card-coop-icon">\uD83D\uDEE1\uFE0F</span>
          <span>with {co_player_name}</span>
        </div>
      )}
    </div>
  );
}
