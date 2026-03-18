import React, { useEffect, useState, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// D20 DICE ROLL — Hero scene selector
// On first visit: spinning animation → lands on random roll (1-20)
// On repeat visits: immediately fires onRollComplete with stored value
// ═══════════════════════════════════════════════════════════════

const SESSION_KEY = 'wonderlore-dice-rolled';

const TAGLINES = [
  'Danger lurks in every shadow',
  'Ancient powers stir',
  'Empires rise and fall',
  'Legends are forged in fire',
  'The realm awaits its champion',
];

function rollToSceneIndex(roll) {
  if (roll <= 4)  return 0;
  if (roll <= 8)  return 1;
  if (roll <= 12) return 2;
  if (roll <= 16) return 3;
  return 4;
}

export default function DiceRoll({ onRollComplete }) {
  const [displayNumber, setDisplayNumber] = useState(20);
  const [finalRoll, setFinalRoll] = useState(null);
  const [phase, setPhase] = useState('spinning'); // 'spinning' | 'landed' | 'fading' | 'done'
  const [visible, setVisible] = useState(true);
  const cycleRef = useRef(null);
  const fireCallbackRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fireComplete = useCallback(
    (roll) => {
      if (fireCallbackRef.current) return;
      fireCallbackRef.current = true;
      const index = rollToSceneIndex(roll);
      const tagline = TAGLINES[index];
      const isNat20 = roll === 20;
      onRollComplete(index, tagline, isNat20);
    },
    [onRollComplete]
  );

  useEffect(() => {
    // Check sessionStorage for a previous roll
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored !== null) {
        const storedRoll = parseInt(stored, 10);
        if (!isNaN(storedRoll) && storedRoll >= 1 && storedRoll <= 20) {
          // Repeat visit — skip animation, immediately fire callback, render nothing
          setVisible(false);
          setPhase('done');
          fireComplete(storedRoll);
          return;
        }
      }
    } catch (_) {
      // sessionStorage unavailable — proceed with animation
    }

    // First visit
    const roll = Math.floor(Math.random() * 20) + 1;

    // Save to sessionStorage
    try {
      sessionStorage.setItem(SESSION_KEY, String(roll));
    } catch (_) {
      // ignore
    }

    if (prefersReducedMotion) {
      // No animation — show static result briefly then fire
      setDisplayNumber(roll);
      setFinalRoll(roll);
      setPhase('landed');
      const t = setTimeout(() => {
        setPhase('fading');
        setVisible(false);
        setPhase('done');
        fireComplete(roll);
      }, 800);
      return () => clearTimeout(t);
    }

    // Normal animated path
    // Phase 1: rapidly cycle numbers for ~1800ms
    let cycleCount = 0;
    const cycleMax = 36; // ~50ms per tick × 36 = 1800ms
    cycleRef.current = setInterval(() => {
      cycleCount++;
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      if (cycleCount >= cycleMax) {
        clearInterval(cycleRef.current);

        // Phase 2: land on final roll
        setDisplayNumber(roll);
        setFinalRoll(roll);
        setPhase('landed');

        // Phase 3: after 1.5s showing result, fade out and fire callback
        setTimeout(() => {
          setPhase('fading');
          setTimeout(() => {
            setVisible(false);
            setPhase('done');
            fireComplete(roll);
          }, 800); // matches CSS opacity transition duration
        }, 1500);
      }
    }, 50);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render anything on repeat visits or after fade-out
  if (!visible || phase === 'done') return null;

  const isNat20 = finalRoll === 20;
  const isSpinning = phase === 'spinning';
  const hasLanded = phase === 'landed' || phase === 'fading';
  const isFading = phase === 'fading';

  return (
    <div
      className={`dice-overlay${isFading ? ' dice-fade-out' : ''}`}
      aria-hidden="true"
    >
      <div
        className={`dice-container${isSpinning ? ' dice-spinning' : ''}${isNat20 && hasLanded ? ' dice-nat20' : ''}`}
      >
        <div className="dice-face">
          <span className="dice-number">{displayNumber}</span>
        </div>
      </div>

      {hasLanded && (
        <div className="dice-result-text">
          You rolled a {finalRoll}!
          {isNat20 && (
            <span className="dice-crit">NATURAL 20 — CRITICAL!</span>
          )}
        </div>
      )}
    </div>
  );
}
