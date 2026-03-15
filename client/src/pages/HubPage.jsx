import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import HubNav from '../components/hub/HubNav.jsx';
import HubTopBar from '../components/hub/HubTopBar.jsx';
import CampaignsView from '../components/hub/CampaignsView.jsx';
import FriendsView from '../components/hub/FriendsView.jsx';
import SettingsView from '../components/hub/SettingsView.jsx';

export default function HubPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('campaigns');

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" />;

  const titles = {
    campaigns: 'Campaigns',
    friends: 'Allies',
    settings: 'Settings',
  };

  const views = { campaigns: CampaignsView, friends: FriendsView, settings: SettingsView };
  const ActiveView = views[activeView];

  return (
    <div className="hub-layout">
      <HubNav activeView={activeView} onNavigate={setActiveView} />
      <div className="hub-main">
        <HubTopBar title={titles[activeView]} />
        <div className="hub-content">
          <ActiveView />
        </div>
      </div>
    </div>
  );
}
