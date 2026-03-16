import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../../styles/campaign-picker.css';

export default function MobileCampaignPicker({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!open) return null;

  const handleBackToHub = () => {
    onClose();
    navigate('/play');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="campaign-picker-backdrop" onClick={handleOverlayClick}>
      <div className="campaign-picker">
        <div className="campaign-picker-header">
          <span className="campaign-picker-title">Campaigns</span>
          <button className="campaign-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="campaign-picker-body">
          <p className="campaign-picker-hint">
            {isAuthenticated
              ? 'Return to the hub to switch campaigns or start a new one.'
              : 'Create an account to save campaigns and track your adventures.'}
          </p>
          {isAuthenticated && (
            <button className="campaign-picker-hub-btn" onClick={handleBackToHub}>
              ⚔ Back to Campaign Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
