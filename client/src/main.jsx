import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import NotificationToast from './components/effects/NotificationToast.jsx';
import LandingPage from './pages/LandingPage.jsx';
import HubPage from './pages/HubPage.jsx';
import PlayPage from './pages/PlayPage.jsx';
import GameSessionPage from './pages/GameSessionPage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import StoriesPage from './pages/StoriesPage.jsx';
import SharePage from './pages/SharePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/play" element={<HubPage />} />
          <Route path="/play/free" element={<PlayPage />} />
          <Route path="/play/campaign/:id" element={<GameSessionPage />} />
          <Route path="/play/lobby/:id" element={<LobbyPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/share/:slug" element={<SharePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <NotificationToast />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);
