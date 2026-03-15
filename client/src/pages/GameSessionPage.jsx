import React from 'react';
import { useParams } from 'react-router-dom';
import { GameProvider } from '../contexts/GameContext.jsx';
import App from '../App.jsx';
import FeedbackWidget from '../components/shared/FeedbackWidget.jsx';

export default function GameSessionPage() {
  const { id } = useParams();
  return (
    <GameProvider campaignId={id}>
      <App />
      <FeedbackWidget />
    </GameProvider>
  );
}
