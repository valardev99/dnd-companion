import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import CampaignCard from './CampaignCard.jsx';
import CampaignDetail from './CampaignDetail.jsx';

export default function CampaignsView() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [joined, setJoined] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await authFetch('/api/campaigns/hub');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.owned || []);
        setJoined(data.joined || []);
        setArchived(data.archived || []);
      }
    } catch (e) {
      // API may not exist yet
    }
    setLoading(false);
  }, [authFetch]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const activeCampaigns = campaigns.filter(c => c.status !== 'archived');
  const canCreate = activeCampaigns.length < 5;

  const handleNewCampaign = () => {
    // Navigate to a new campaign session (the wizard will show)
    navigate('/play/campaign/new');
  };

  const handleCardClick = (campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleArchived = (id) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setJoined(prev => prev.filter(c => c.id !== id));
    setSelectedCampaign(null);
    fetchCampaigns();
  };

  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onArchived={handleArchived}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <div className="campaigns-view">
      {/* Header with New Campaign button */}
      <div className="campaigns-view-header">
        <h2 className="campaigns-view-title">Your Campaigns</h2>
        <button
          className="campaigns-new-btn"
          onClick={handleNewCampaign}
          disabled={!canCreate}
          title={!canCreate ? 'Maximum 5 active campaigns' : 'Create a new campaign'}
        >
          + New Campaign
        </button>
      </div>

      {loading ? (
        <div className="campaigns-loading">Consulting the ancient tomes...</div>
      ) : (
        <>
          {/* Active Campaigns */}
          {activeCampaigns.length === 0 && joined.length === 0 ? (
            <div className="campaigns-empty">
              <div className="campaigns-empty-icon">\uD83D\uDCDC</div>
              <h3>No campaigns yet</h3>
              <p>Begin your first adventure by creating a new campaign.</p>
            </div>
          ) : (
            <>
              <div className="campaigns-grid">
                {activeCampaigns.map(c => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onClick={() => handleCardClick(c)}
                    isSelected={false}
                  />
                ))}
              </div>

              {/* Joined Campaigns */}
              {joined.length > 0 && (
                <>
                  <h3 className="campaigns-section-title">Joined Campaigns</h3>
                  <div className="campaigns-grid">
                    {joined.map(c => (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        onClick={() => handleCardClick(c)}
                        isSelected={false}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Archived Section */}
          {archived.length > 0 && (
            <div className="campaigns-archived-section">
              <button
                className="campaigns-archived-toggle"
                onClick={() => setShowArchived(!showArchived)}
              >
                <span>{showArchived ? '\u25BC' : '\u25B6'}</span>
                Archived ({archived.length})
              </button>
              {showArchived && (
                <div className="campaigns-grid campaigns-archived-grid">
                  {archived.map(c => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      onClick={() => handleCardClick(c)}
                      isSelected={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
