import React, { useEffect, useState, useRef } from 'react';

/**
 * Inline dice-roll card rendered in the chat log for `role: 'roll'` messages.
 * Cycles the die face for ~600ms then lands on the result — the d20 is the
 * heart of the game and deserves more than a corner toast. Reuses the visual
 * language of the landing-page DiceRoll.
 *
 * roll: { type, rolled, modifier, dc, total, success, crit, critFail, result }
 */
export default function DiceRollCard({ roll }) {
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [face, setFace] = useState(prefersReduced ? roll.rolled : 1);
  const [landed, setLanded] = useState(prefersReduced);
  const startedRef = useRef(false);

  useEffect(() => {
    if (prefersReduced || startedRef.current) return;
    startedRef.current = true;
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setFace(1 + Math.floor(Math.random() * 20));
      if (i >= 12) {
        clearInterval(iv);
        setFace(roll.rolled);
        setLanded(true);
      }
    }, 45);
    return () => clearInterval(iv);
  }, [prefersReduced, roll.rolled]);

  const outcome = roll.critFail ? 'critfail' : roll.crit ? 'crit' : roll.success ? 'success' : 'fail';
  const outcomeLabel = roll.critFail ? 'CRITICAL FAILURE'
    : roll.crit ? 'CRITICAL SUCCESS'
    : roll.success ? 'SUCCESS' : 'FAILURE';

  return (
    <div className={`dice-card dice-card--${outcome} ${landed ? 'landed' : 'rolling'}`}>
      <div className="dice-card-die" aria-hidden="true">
        <span className="dice-card-face">{face}</span>
      </div>
      <div className="dice-card-body">
        <div className="dice-card-type">{roll.type}</div>
        <div className="dice-card-math">
          <span className="dice-card-roll">{roll.rolled}</span>
          {roll.modifier ? <span className="dice-card-mod"> {roll.modifier >= 0 ? '+' : ''}{roll.modifier}</span> : null}
          {roll.dc != null ? <span className="dice-card-vs"> vs DC {roll.dc}</span> : null}
          {roll.total != null ? <span className="dice-card-total"> = {roll.total}</span> : null}
        </div>
        {landed && <div className={`dice-card-outcome dice-card-outcome--${outcome}`}>{outcomeLabel}</div>}
      </div>
    </div>
  );
}
