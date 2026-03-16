import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/combat-banner.css';

export default function CombatBanner() {
  const { state } = useGame();
  const { combat } = state.gameData;

  if (!combat.active) return null;

  const enemies = combat.enemies || [];
  const enemySummary = enemies.length > 0
    ? enemies.map(e => e.name).join(', ')
    : 'Unknown foes';

  return (
    <div className="combat-banner">
      <div className="combat-banner-label">⚔ COMBAT</div>
      <div className="combat-banner-enemies">{enemySummary}</div>
    </div>
  );
}
