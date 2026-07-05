import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';

/**
 * "You have fallen" death state. Appears when HP hits 0 (SET_DEFEATED).
 * Offers two outs: accept the end (leave to the hub / archive), or let the
 * story continue (the DM narrates a rescue / consequence). We don't force an
 * archive here — the DM drives what "death" means in this world.
 */
export default function DefeatOverlay() {
  const { state, dispatch } = useGame();
  if (!state.isDefeated) return null;

  const continueOn = () => dispatch({ type: 'SET_DEFEATED', payload: false });

  return (
    <div className="defeat-overlay" role="dialog" aria-label="You have fallen">
      <div className="defeat-content">
        <div className="defeat-title">You Have Fallen</div>
        <div className="defeat-flavor">
          Darkness closes in. Your tale hangs on a knife&rsquo;s edge&hellip;
        </div>
        <div className="defeat-actions">
          <button className="defeat-btn defeat-btn-continue" onClick={continueOn}>
            Cling to life
          </button>
          <a className="defeat-btn defeat-btn-leave" href="/play">
            Lay down the tale
          </a>
        </div>
        <div className="defeat-hint">
          Tell your DM what you do — beg, bargain, or rage against the dark.
        </div>
      </div>
    </div>
  );
}
