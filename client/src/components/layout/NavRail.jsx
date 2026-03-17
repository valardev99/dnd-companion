import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/nav-rail.css';

export default function NavRail({ campaigns = [], activeCampaignId }) {
  const navigate = useNavigate();

  const handleCampaignClick = (campaignId) => {
    if (campaignId !== activeCampaignId) {
      navigate(`/play/campaign/${campaignId}`);
    }
  };

  const handleNewCampaign = () => {
    navigate('/play');
  };

  const handleSettings = () => {
    navigate('/play');
  };

  return (
    <nav className="nav-rail" aria-label="Campaign navigation">
      <div className="nav-rail-logo" title="Wonderlore AI">W</div>
      <div className="nav-rail-divider" />
      <div className="nav-rail-campaigns">
        {campaigns.map(c => (
          <button
            key={c.id}
            className={`nav-rail-campaign ${c.id === activeCampaignId ? 'active' : ''}`}
            onClick={() => handleCampaignClick(c.id)}
            title={c.name}
          >
            {(c.name || 'C')[0].toUpperCase()}
          </button>
        ))}
      </div>
      <div className="nav-rail-bottom">
        <button className="nav-rail-action" onClick={handleNewCampaign} title="New Campaign">+</button>
        <button className="nav-rail-action" onClick={handleSettings} title="Settings">⚙</button>
      </div>
    </nav>
  );
}
