import React from 'react';
import { GameProvider } from '../contexts/GameContext.jsx';
import GameApp from '../App.jsx';
import FeedbackWidget from '../components/shared/FeedbackWidget.jsx';

export default function PlayPage() {
  return (
    <GameProvider>
      <GameApp />
      <FeedbackWidget />
    </GameProvider>
  );
}
