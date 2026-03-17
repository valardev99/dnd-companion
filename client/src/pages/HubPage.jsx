import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import HubNav from '../components/hub/HubNav.jsx';
import HubTopBar from '../components/hub/HubTopBar.jsx';
import CampaignsView from '../components/hub/CampaignsView.jsx';
import FriendsView from '../components/hub/FriendsView.jsx';
import SettingsView from '../components/hub/SettingsView.jsx';
import ProfileDrawer from '../components/hub/ProfileDrawer.jsx';
import VerifyBanner from '../components/auth/VerifyBanner.jsx';

export default function HubPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('campaigns');
  const [profileOpen, setProfileOpen] = useState(false);

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
      <HubNav
        activeView={activeView}
        onNavigate={setActiveView}
        onProfileClick={() => setProfileOpen(true)}
      />
      <div className="hub-main">
        <HubTopBar title={titles[activeView]} onProfileClick={() => setProfileOpen(true)} />
        <div className="hub-content">
          <VerifyBanner />
          <ActiveView />
        </div>
      </div>
      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
