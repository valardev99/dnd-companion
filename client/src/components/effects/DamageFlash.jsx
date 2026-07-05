import React, { useEffect, useState } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

/**
 * Screen-edge vignette flash for damage (crimson) and healing (emerald).
 * Driven by the `pulseEffect` state set from HP_CHANGE tags. Diablo-style
 * inward glow — no shake, no bounce (per the dark-fantasy mandate).
 */
export default function DamageFlash() {
  const { state, dispatch } = useGame();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!state.pulseEffect) return;
    setActive(state.pulseEffect);
    const t = setTimeout(() => {
      setActive(null);
      dispatch({ type: 'CLEAR_PULSE' });
    }, 650);
    return () => clearTimeout(t);
    // pulseId changes on every pulse so repeated same-type hits re-fire
  }, [state.pulseId, state.pulseEffect, dispatch]);

  if (!active) return null;
  return <div className={`screen-pulse screen-pulse--${active}`} aria-hidden="true" />;
}
