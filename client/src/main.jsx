import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlayPage from './pages/PlayPage.jsx';
import StoriesPage from './pages/StoriesPage.jsx';
import SharePage from './pages/SharePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/share/:slug" element={<SharePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
