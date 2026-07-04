import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import NotificationToast from './components/effects/NotificationToast.jsx';
import LandingPage from './pages/LandingPage.jsx';
import HubPage from './pages/HubPage.jsx';
import GameSessionPage from './pages/GameSessionPage.jsx';
import './styles/index.css';

// Cold routes — lazy-loaded so first paint of landing/hub/game doesn't pay
// for admin dashboards, story galleries, or one-time auth pages.
const LobbyPage = lazy(() => import('./pages/LobbyPage.jsx'));
const StoriesPage = lazy(() => import('./pages/StoriesPage.jsx'));
const SharePage = lazy(() => import('./pages/SharePage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.jsx'));

const routeFallback = (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--obsidian, #0c0a06)',
    color: 'var(--muted, #9a8d7a)',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '2px',
  }}>
    LOADING...
  </div>
);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/play" element={<HubPage />} />

            <Route path="/play/campaign/:id" element={<GameSessionPage />} />
            <Route path="/play/lobby/:id" element={<LobbyPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/share/:slug" element={<SharePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </Suspense>
        <NotificationToast />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);
