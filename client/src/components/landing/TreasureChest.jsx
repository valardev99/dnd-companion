import { useRef, useState, useEffect } from 'react';

const SESSION_KEY = 'wonderlore-cta-revealed';

// Ancient rune symbols that light up in sequence
const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];

export default function RuneRevealCTA() {
  const ref = useRef(null);
  const [phase, setPhase] = useState('hidden'); // hidden → runes → glow → revealed
  const [activeRunes, setActiveRunes] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alreadySeen = sessionStorage.getItem(SESSION_KEY) === 'true';

    if (mq.matches || alreadySeen) {
      setPhase('revealed');
      setActiveRunes(RUNES.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPhase('runes');
            sessionStorage.setItem(SESSION_KEY, 'true');

            // Light up runes one by one
            let i = 0;
            const runeInterval = setInterval(() => {
              i++;
              setActiveRunes(i);
              if (i >= RUNES.length) {
                clearInterval(runeInterval);
                // All runes lit → glow phase
                setTimeout(() => setPhase('glow'), 400);
                // Glow → reveal content
                setTimeout(() => setPhase('revealed'), 1200);
              }
            }, 120);

            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`rune-cta rune-cta--${phase}`}>
      {/* Background radial glow */}
      <div className="rune-cta-glow" />

      {/* Rune circle */}
      <div className="rune-circle">
        {RUNES.map((rune, i) => {
          const angle = (i / RUNES.length) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const radius = 120;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          return (
            <span
              key={i}
              className={`rune-symbol ${i < activeRunes ? 'rune-active' : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                transitionDelay: `${i * 0.08}s`,
              }}
            >
              {rune}
            </span>
          );
        })}
        {/* Center portal glow */}
        <div className="rune-portal" />
      </div>

      {/* Content that materializes */}
      <div className="rune-cta-content">
        <h2 className="rune-cta-title">Your Story Begins Now</h2>
        <p className="rune-cta-subtitle">No downloads. No paywalls. Free to play.</p>
        <a href="/play" className="btn-premium rune-cta-btn">
          CLAIM YOUR DESTINY
        </a>
      </div>
    </section>
  );
}
