import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LoginModal from '../components/auth/LoginModal.jsx';
import RegisterModal from '../components/auth/RegisterModal.jsx';

// ═══════════════════════════════════════════════════════════════
// INLINE SVG ICONS — Dark Fantasy themed replacements for emojis
// ═══════════════════════════════════════════════════════════════

/* Step 1: Herald Horn (Speak) */
function IconHeraldHorn() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Horn body */}
      <path d="M8 28 L8 20 Q8 16 12 14 L28 8 Q32 6 32 10 L32 38 Q32 42 28 40 L12 34 Q8 32 8 28Z" />
      {/* Horn bell flare */}
      <path d="M32 10 Q38 8 40 6" />
      <path d="M32 38 Q38 40 40 42" />
      <path d="M32 24 L36 24" />
      {/* Sound waves */}
      <path d="M38 18 Q42 22 42 24 Q42 26 38 30" strokeWidth="1.5" fill="none" />
      <path d="M41 14 Q46 20 46 24 Q46 28 41 34" strokeWidth="1.5" fill="none" />
      {/* Mouthpiece */}
      <rect x="5" y="19" width="3" height="10" rx="1" />
      {/* Decorative band */}
      <line x1="20" y1="11" x2="20" y2="37" strokeWidth="1" opacity="0.5" />
      <line x1="26" y1="9" x2="26" y2="39" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/* Step 2: Arcane Eye with ripple circles (World Reacts) */
function IconArcaneEye() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Outer arcane circle */}
      <circle cx="24" cy="24" r="20" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
      {/* Middle arcane circle */}
      <circle cx="24" cy="24" r="15" strokeWidth="1" opacity="0.5" strokeDasharray="2 4" />
      {/* Eye shape */}
      <path d="M6 24 Q14 12 24 12 Q34 12 42 24 Q34 36 24 36 Q14 36 6 24Z" strokeWidth="1.8" />
      {/* Iris */}
      <circle cx="24" cy="24" r="7" strokeWidth="1.5" />
      {/* Pupil */}
      <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
      {/* Light reflection */}
      <circle cx="22" cy="22" r="1.5" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Arcane rune marks around eye */}
      <line x1="24" y1="2" x2="24" y2="6" strokeWidth="1" opacity="0.4" />
      <line x1="24" y1="42" x2="24" y2="46" strokeWidth="1" opacity="0.4" />
      <line x1="2" y1="24" x2="6" y2="24" strokeWidth="1" opacity="0.4" />
      <line x1="42" y1="24" x2="46" y2="24" strokeWidth="1" opacity="0.4" />
      {/* Diagonal rune ticks */}
      <line x1="7" y1="7" x2="10" y2="10" strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="7" x2="41" y2="10" strokeWidth="1" opacity="0.3" />
      <line x1="7" y1="41" x2="10" y2="38" strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="41" x2="41" y2="38" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

/* Step 3: Sword through Shield (Consequences Follow) */
function IconSwordShield() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Shield body */}
      <path d="M12 10 L24 6 L36 10 L36 26 Q36 36 24 42 Q12 36 12 26Z" strokeWidth="1.8" />
      {/* Shield cross detail */}
      <line x1="24" y1="10" x2="24" y2="38" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="20" x2="34" y2="20" strokeWidth="1" opacity="0.4" />
      {/* Shield boss (center circle) */}
      <circle cx="24" cy="22" r="4" strokeWidth="1" opacity="0.5" />
      {/* Sword blade — diagonal through shield */}
      <line x1="8" y1="4" x2="40" y2="40" strokeWidth="2" />
      {/* Sword guard */}
      <line x1="16" y1="16" x2="10" y2="10" strokeWidth="2.5" />
      <line x1="6" y1="8" x2="14" y2="8" strokeWidth="2" />
      <line x1="6" y1="8" x2="6" y2="16" strokeWidth="2" />
      {/* Sword pommel */}
      <circle cx="6" cy="5" r="2" strokeWidth="1.5" />
      {/* Sword tip */}
      <path d="M38 38 L42 42 L40 44 L36 40" strokeWidth="1.5" />
      {/* Crack lines on shield from sword */}
      <path d="M26 20 L30 16" strokeWidth="1" opacity="0.5" />
      <path d="M22 24 L18 28" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/* Pillar 1: Broken Chains (Total Freedom) */
function IconBrokenChains() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Left chain links */}
      <ellipse cx="10" cy="36" rx="4" ry="3" strokeWidth="1.8" />
      <ellipse cx="10" cy="30" rx="3" ry="3" strokeWidth="1.8" />
      <ellipse cx="12" cy="24" rx="3" ry="3" strokeWidth="1.8" />
      {/* Broken link left side */}
      <path d="M14 21 Q16 18 15 14" strokeWidth="2" />
      <path d="M10 21 Q8 16 10 12" strokeWidth="2" />
      {/* Burst lines from break — left */}
      <line x1="12" y1="12" x2="8" y2="6" strokeWidth="1.5" opacity="0.7" />
      <line x1="14" y1="14" x2="16" y2="8" strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="11" x2="4" y2="8" strokeWidth="1.5" opacity="0.5" />
      {/* Right chain links */}
      <ellipse cx="38" cy="36" rx="4" ry="3" strokeWidth="1.8" />
      <ellipse cx="38" cy="30" rx="3" ry="3" strokeWidth="1.8" />
      <ellipse cx="36" cy="24" rx="3" ry="3" strokeWidth="1.8" />
      {/* Broken link right side */}
      <path d="M34 21 Q32 18 33 14" strokeWidth="2" />
      <path d="M38 21 Q40 16 38 12" strokeWidth="2" />
      {/* Burst lines from break — right */}
      <line x1="36" y1="12" x2="40" y2="6" strokeWidth="1.5" opacity="0.7" />
      <line x1="34" y1="14" x2="32" y2="8" strokeWidth="1.5" opacity="0.7" />
      <line x1="38" y1="11" x2="44" y2="8" strokeWidth="1.5" opacity="0.5" />
      {/* Center shackle bar (broken in middle) */}
      <path d="M10 40 L10 44 L18 44 L18 40" strokeWidth="1.5" />
      <path d="M38 40 L38 44 L30 44 L30 40" strokeWidth="1.5" />
      {/* Spark/energy at break point */}
      <circle cx="12" cy="10" r="1" fill="currentColor" opacity="0.6" stroke="none" />
      <circle cx="36" cy="10" r="1" fill="currentColor" opacity="0.6" stroke="none" />
    </svg>
  );
}

/* Pillar 2: Hourglass with World (Living Persistence) */
function IconHourglassWorld() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Top frame */}
      <line x1="10" y1="4" x2="38" y2="4" strokeWidth="2" />
      <line x1="10" y1="6" x2="38" y2="6" strokeWidth="1" opacity="0.5" />
      {/* Bottom frame */}
      <line x1="10" y1="44" x2="38" y2="44" strokeWidth="2" />
      <line x1="10" y1="42" x2="38" y2="42" strokeWidth="1" opacity="0.5" />
      {/* Hourglass glass — top half */}
      <path d="M14 6 Q14 16 24 24" strokeWidth="1.5" />
      <path d="M34 6 Q34 16 24 24" strokeWidth="1.5" />
      {/* Hourglass glass — bottom half */}
      <path d="M14 42 Q14 32 24 24" strokeWidth="1.5" />
      <path d="M34 42 Q34 32 24 24" strokeWidth="1.5" />
      {/* Globe / world inside top */}
      <circle cx="24" cy="14" r="6" strokeWidth="1" opacity="0.6" />
      {/* Continent lines on globe */}
      <path d="M20 12 Q22 10 24 12 Q26 14 28 12" strokeWidth="1" opacity="0.5" fill="none" />
      <path d="M21 16 Q23 15 25 16" strokeWidth="1" opacity="0.5" fill="none" />
      {/* Sand stream */}
      <line x1="24" y1="20" x2="24" y2="28" strokeWidth="1" opacity="0.4" strokeDasharray="1 2" />
      {/* Sand pile bottom */}
      <path d="M20 38 Q22 34 24 34 Q26 34 28 38" strokeWidth="1" opacity="0.5" fill="currentColor" fillOpacity="0.15" />
      {/* Small tree of life growing from sand */}
      <line x1="24" y1="38" x2="24" y2="32" strokeWidth="1.2" />
      <path d="M22 34 L24 32 L26 34" strokeWidth="1" fill="none" />
      <path d="M21 36 L24 33 L27 36" strokeWidth="1" fill="none" />
      {/* Decorative finials */}
      <circle cx="10" cy="4" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="38" cy="4" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="10" cy="44" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="38" cy="44" r="1.5" fill="currentColor" opacity="0.4" stroke="none" />
    </svg>
  );
}

/* Pillar 3: Skull with Crown (Real Consequences) */
function IconSkullCrown() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Crown */}
      <path d="M12 16 L10 6 L16 12 L20 4 L24 12 L28 4 L32 12 L38 6 L36 16" strokeWidth="1.8" />
      {/* Crown base band */}
      <rect x="12" y="14" width="24" height="3" rx="0.5" strokeWidth="1" opacity="0.6" />
      {/* Crown jewels */}
      <circle cx="18" cy="15.5" r="1" fill="currentColor" opacity="0.5" stroke="none" />
      <circle cx="24" cy="15.5" r="1" fill="currentColor" opacity="0.5" stroke="none" />
      <circle cx="30" cy="15.5" r="1" fill="currentColor" opacity="0.5" stroke="none" />
      {/* Skull cranium */}
      <path d="M12 28 Q12 17 24 17 Q36 17 36 28" strokeWidth="1.8" />
      {/* Skull cheekbones / jaw sides */}
      <path d="M12 28 L12 32 Q12 34 14 34" strokeWidth="1.8" />
      <path d="M36 28 L36 32 Q36 34 34 34" strokeWidth="1.8" />
      {/* Jaw / teeth area */}
      <path d="M14 34 L14 38 L34 38 L34 34" strokeWidth="1.8" />
      {/* Eye sockets */}
      <ellipse cx="19" cy="26" rx="3.5" ry="4" strokeWidth="1.5" />
      <ellipse cx="29" cy="26" rx="3.5" ry="4" strokeWidth="1.5" />
      {/* Nose cavity */}
      <path d="M22 31 L24 34 L26 31" strokeWidth="1.2" />
      {/* Teeth */}
      <line x1="18" y1="34" x2="18" y2="38" strokeWidth="1" opacity="0.6" />
      <line x1="21" y1="34" x2="21" y2="38" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="34" x2="24" y2="38" strokeWidth="1" opacity="0.6" />
      <line x1="27" y1="34" x2="27" y2="38" strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="34" x2="30" y2="38" strokeWidth="1" opacity="0.6" />
      {/* Mandible bottom */}
      <path d="M16 38 Q18 42 24 42 Q30 42 32 38" strokeWidth="1.5" />
    </svg>
  );
}

/* Story 1: Dragon Head */
function IconDragonHead() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Dragon head outline */}
      <path d="M8 30 Q6 24 10 18 Q14 12 20 10 Q24 8 28 10 Q34 12 38 18 L42 14 L40 22 Q42 26 42 30 Q42 36 36 38 L30 40 Q24 42 18 40 Q12 38 10 34 Q8 32 8 30Z" strokeWidth="1.8" />
      {/* Horn left */}
      <path d="M16 12 Q12 4 8 2" strokeWidth="1.5" />
      {/* Horn right */}
      <path d="M30 10 Q32 4 36 2" strokeWidth="1.5" />
      {/* Eye */}
      <ellipse cx="22" cy="22" rx="3" ry="2.5" strokeWidth="1.5" />
      <ellipse cx="22" cy="22" rx="1" ry="2" fill="currentColor" stroke="none" />
      {/* Nostril */}
      <circle cx="12" cy="28" r="1.5" strokeWidth="1.2" />
      {/* Snout ridge */}
      <path d="M14 24 Q18 20 22 19" strokeWidth="1" opacity="0.5" />
      {/* Jaw line */}
      <path d="M10 32 Q16 36 24 38" strokeWidth="1.2" />
      {/* Teeth */}
      <path d="M12 32 L13 35" strokeWidth="1.2" />
      <path d="M16 34 L16.5 37" strokeWidth="1.2" />
      <path d="M20 35 L20 38" strokeWidth="1.2" />
      {/* Scale details on head */}
      <path d="M28 16 Q30 18 28 20" strokeWidth="1" opacity="0.4" />
      <path d="M32 18 Q34 20 32 22" strokeWidth="1" opacity="0.4" />
      <path d="M34 22 Q36 24 34 26" strokeWidth="1" opacity="0.4" />
      {/* Ear / fin */}
      <path d="M32 12 Q36 8 42 14" strokeWidth="1.2" />
      {/* Smoke from nostril */}
      <path d="M10 26 Q6 24 4 22" strokeWidth="1" opacity="0.3" />
      <path d="M10 27 Q7 26 5 28" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/* Story 2: Chicken / Polymorph */
function IconPolymorphChicken() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Magic sparkles around chicken */}
      <path d="M8 8 L10 6 L12 8 L10 10Z" fill="currentColor" opacity="0.4" stroke="none" />
      <path d="M38 6 L40 4 L42 6 L40 8Z" fill="currentColor" opacity="0.3" stroke="none" />
      <path d="M6 28 L8 26 L10 28 L8 30Z" fill="currentColor" opacity="0.3" stroke="none" />
      <circle cx="36" cy="12" r="1" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="42" cy="20" r="0.8" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Swirl lines (magic transformation) */}
      <path d="M12 12 Q16 8 20 12" strokeWidth="1" opacity="0.4" />
      <path d="M34 10 Q38 14 34 18" strokeWidth="1" opacity="0.4" />
      {/* Comb on head */}
      <path d="M20 12 Q22 6 24 10 Q26 6 28 10 Q30 6 30 12" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
      {/* Chicken head */}
      <circle cx="24" cy="16" r="5" strokeWidth="1.8" />
      {/* Eye */}
      <circle cx="22" cy="15" r="1.5" strokeWidth="1.2" />
      <circle cx="22" cy="15" r="0.6" fill="currentColor" stroke="none" />
      {/* Beak */}
      <path d="M28 16 L34 18 L28 20" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      {/* Wattle */}
      <path d="M26 20 Q28 24 24 24" strokeWidth="1.2" />
      {/* Body */}
      <ellipse cx="22" cy="32" rx="10" ry="8" strokeWidth="1.8" />
      {/* Wing */}
      <path d="M14 28 Q10 32 12 36 Q16 38 18 34" strokeWidth="1.2" />
      <path d="M14 30 Q12 32 13 34" strokeWidth="1" opacity="0.5" />
      {/* Tail feathers */}
      <path d="M32 28 Q38 24 40 28" strokeWidth="1.2" />
      <path d="M32 30 Q38 28 40 32" strokeWidth="1.2" />
      <path d="M32 32 Q36 32 38 36" strokeWidth="1.2" />
      {/* Legs */}
      <line x1="20" y1="38" x2="18" y2="44" strokeWidth="1.5" />
      <line x1="26" y1="38" x2="28" y2="44" strokeWidth="1.5" />
      {/* Feet */}
      <path d="M14 44 L18 44 L20 46" strokeWidth="1.2" />
      <path d="M24 44 L28 44 L30 46" strokeWidth="1.2" />
    </svg>
  );
}

/* Story 3: Fortress Under Siege */
function IconFortressSiege() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Left tower */}
      <rect x="4" y="20" width="8" height="22" strokeWidth="1.5" />
      {/* Left tower battlement */}
      <path d="M4 20 L4 16 L6 16 L6 18 L8 18 L8 16 L10 16 L10 18 L12 18 L12 20" strokeWidth="1.2" />
      {/* Right tower */}
      <rect x="36" y="20" width="8" height="22" strokeWidth="1.5" />
      {/* Right tower battlement */}
      <path d="M36 20 L36 16 L38 16 L38 18 L40 18 L40 16 L42 16 L42 18 L44 18 L44 20" strokeWidth="1.2" />
      {/* Center wall */}
      <rect x="12" y="26" width="24" height="16" strokeWidth="1.5" />
      {/* Center battlement */}
      <path d="M12 26 L12 24 L14 24 L14 26 L16 26 L16 24 L18 24 L18 26" strokeWidth="1.2" />
      <path d="M30 26 L30 24 L32 24 L32 26 L34 26 L34 24 L36 24 L36 26" strokeWidth="1.2" />
      {/* Gate */}
      <path d="M20 42 L20 32 Q24 28 28 32 L28 42" strokeWidth="1.5" />
      {/* Gate portcullis lines */}
      <line x1="22" y1="32" x2="22" y2="42" strokeWidth="0.8" opacity="0.5" />
      <line x1="24" y1="30" x2="24" y2="42" strokeWidth="0.8" opacity="0.5" />
      <line x1="26" y1="32" x2="26" y2="42" strokeWidth="0.8" opacity="0.5" />
      {/* Central keep tower */}
      <rect x="20" y="18" width="8" height="8" strokeWidth="1.2" />
      <path d="M20 18 L24 12 L28 18" strokeWidth="1.5" />
      {/* Banner on keep */}
      <line x1="24" y1="12" x2="24" y2="6" strokeWidth="1.2" />
      <path d="M24 6 L30 8 L24 10" fill="currentColor" fillOpacity="0.2" strokeWidth="1" />
      {/* Catapult projectile arcs (siege!) */}
      <path d="M2 8 Q12 2 18 14" strokeWidth="1.2" opacity="0.5" strokeDasharray="2 2" />
      <path d="M46 6 Q38 2 34 10" strokeWidth="1.2" opacity="0.5" strokeDasharray="2 2" />
      {/* Fire/explosion on wall */}
      <path d="M14 22 Q16 18 18 22" strokeWidth="1.2" opacity="0.6" />
      <path d="M15 22 Q16 20 17 22" strokeWidth="1" opacity="0.4" />
      {/* Flying debris */}
      <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.4" stroke="none" />
      <circle cx="40" cy="8" r="0.8" fill="currentColor" opacity="0.3" stroke="none" />
      {/* Ground line */}
      <line x1="2" y1="42" x2="46" y2="42" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// LANDING PARTICLE EFFECT — Lightweight arcane particles for hero
// ═══════════════════════════════════════════════════════════════

function LandingParticles() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const runes = ['\u2295','\u2297','\u25B3','\u25C7','\u263D','\u27D0','\u22B9','\u2727','\u25C8','\u27E1','\u229B','\u27C1'];
    const count = 55;

    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15 - 0.08,
      size: 8 + Math.random() * 16,
      opacity: 0.04 + Math.random() * 0.12,
      rune: runes[Math.floor(Math.random() * runes.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.004 + Math.random() * 0.012,
    }));

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
        ctx.fillText(p.rune, p.x, p.y);
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

// ═══════════════════════════════════════════════════════════════
// HERO IMAGES — rotating banner
// ═══════════════════════════════════════════════════════════════
const HERO_IMAGES = [
  '/images/hero-1.png',
  '/images/hero-2.png',
  '/images/hero-3.png',
  '/images/hero-4.png',
  '/images/hero-5.png',
];

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [heroIndex, setHeroIndex] = useState(0);

  const handleAuthSuccess = () => {
    setAuthModal(null);
    navigate('/play');
  };

  // Rotate hero images every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="landing-page">

      {/* ─── Auth Modals ─── */}
      {authModal === 'login' && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setAuthModal('register')}
        />
      )}
      {authModal === 'register' && (
        <RegisterModal
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}

      {/* ─── Navigation ─── */}
      <nav className="landing-nav">
        <span className="landing-nav-brand">Wanderlore AI</span>
        <div className="landing-nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#what-makes-us-different">Features</a>
          <a href="#stories">Stories</a>
          <div className="landing-nav-auth">
            {isAuthenticated ? (
              <>
                <span className="landing-nav-user">{user?.username || user?.email}</span>
                <button onClick={logout} className="landing-nav-link-btn">Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => setAuthModal('login')} className="landing-nav-link-btn">Sign In</button>
                <button onClick={() => setAuthModal('register')} className="landing-cta-btn landing-cta-btn-secondary landing-nav-create-btn">
                  Create Account
                </button>
              </>
            )}
          </div>
          <Link to="/play" className="landing-cta-btn landing-cta-btn-secondary" style={{ padding: '6px 16px', fontSize: '1.2rem' }}>
            Play Free
          </Link>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          {HERO_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`landing-hero-bg-img ${i === heroIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        <LandingParticles />
        <div className="landing-hero-content">
          <div className="landing-hero-rune">
            {'\u25C7'} {'\u2727'} {'\u25C8'} {'\u2727'} {'\u25C7'}
          </div>
          <h1 className="landing-hero-title">Wanderlore AI</h1>
          <p className="landing-hero-subtitle">AI-Driven Dark Fantasy</p>
          <div className="landing-hero-divider" />
          <p className="landing-hero-tagline">
            Enter a world with no rules, no preset expectations. You lead the story
            and every choice you make has impact and consequence.
          </p>
          <div className="landing-hero-cta">
            <Link to="/play" className="landing-cta-btn">
              Play Free
            </Link>
          </div>
        </div>
        <div className="landing-scroll-indicator">
          <span>Discover</span>
          <div className="landing-scroll-arrow" />
        </div>
      </section>

      <div className="landing-divider-ornate" />

      {/* ─── How It Works ─── */}
      <section className="landing-section" id="how-it-works">
        <p className="landing-section-label">The Experience</p>
        <h2 className="landing-section-title">How It Works</h2>
        <p className="landing-section-subtitle">
          No tutorials, no hand-holding. Just you, your wits, and a world that reacts
          to everything you do.
        </p>

        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-number"><span>I</span></div>
            <div className="landing-icon"><IconHeraldHorn /></div>
            <h3 className="landing-step-title">Speak</h3>
            <p className="landing-step-desc">
              Tell the DM what you want to do. Anything. Persuade a king, burn down a tavern,
              befriend a dragon. There are no menus -- only your imagination.
            </p>
          </div>

          <div className="landing-step">
            <div className="landing-step-number"><span>II</span></div>
            <div className="landing-icon"><IconArcaneEye /></div>
            <h3 className="landing-step-title">The World Reacts</h3>
            <p className="landing-step-desc">
              Every action ripples through a living, persistent world. NPCs remember.
              Factions shift. The consequences of your choices echo through time.
            </p>
          </div>

          <div className="landing-step">
            <div className="landing-step-number"><span>III</span></div>
            <div className="landing-icon"><IconSwordShield /></div>
            <h3 className="landing-step-title">Consequences Follow</h3>
            <p className="landing-step-desc">
              Your choices shape the story. Victory means nothing without the risk of failure.
              This world does not coddle you -- it respects you.
            </p>
          </div>
        </div>
      </section>

      <div className="landing-divider-ornate" />

      {/* ─── What Makes Us Different ─── */}
      <div className="landing-pillars-bg" id="what-makes-us-different">
        <section className="landing-section">
          <p className="landing-section-label">Our Philosophy</p>
          <h2 className="landing-section-title">What Makes Us Different</h2>
          <p className="landing-section-subtitle">
            Freedom WITH consequences. If there isn't difficulty, there isn't risk.
            If there isn't punishment, accomplishment means nothing.
          </p>

          <div className="landing-pillars">
            <div className="landing-pillar">
              <div className="landing-icon"><IconBrokenChains /></div>
              <h3 className="landing-pillar-title">Total Freedom</h3>
              <p className="landing-pillar-desc">
                No predefined paths. No invisible walls. No dialogue trees.
                Attempt anything your mind can conceive. The AI dungeon master
                handles whatever you throw at it.
              </p>
              <span className="landing-pillar-accent">
                "The only limit is your imagination."
              </span>
            </div>

            <div className="landing-pillar">
              <div className="landing-icon"><IconHourglassWorld /></div>
              <h3 className="landing-pillar-title">Living Persistence</h3>
              <p className="landing-pillar-desc">
                NPCs remember every interaction. The world evolves based on your actions.
                Your reputation precedes you. Betray an ally and word will spread.
                Save a village and they will remember.
              </p>
              <span className="landing-pillar-accent">
                "Every action writes history."
              </span>
            </div>

            <div className="landing-pillar">
              <div className="landing-icon"><IconSkullCrown /></div>
              <h3 className="landing-pillar-title">Real Consequences</h3>
              <p className="landing-pillar-desc">
                Try to kill a god at level 1? You die. That IS the consequence.
                The thrill exists BECAUSE failure is real. No save-scumming.
                No plot armor. Just a world that treats you as real.
              </p>
              <span className="landing-pillar-accent">
                "Victory earned, not given."
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="landing-divider-ornate" />

      {/* ─── Player Stories ─── */}
      <div className="landing-stories-bg" id="stories">
        <section className="landing-section">
          <p className="landing-section-label">Tales From The Realm</p>
          <h2 className="landing-section-title">Epic Moments From The Community</h2>
          <p className="landing-section-subtitle">
            Every session creates stories worth telling. Here are a few that
            players couldn't stop talking about.
          </p>

          <div className="landing-stories">
            <div className="landing-story-card">
              <div className="landing-story-image">
                <img src="/images/story-1.png" alt="Dragon throne room" className="landing-story-img" />
              </div>
              <div className="landing-story-body">
                <p className="landing-story-quote">
                  I convinced the dragon to join my side by offering it the throne.
                  Two sessions later, the dragon betrayed me and took the kingdom for itself.
                  Best campaign I've ever played.
                </p>
                <p className="landing-story-author">-- Adventurer, Session 47</p>
                <span className="landing-story-tag">Dragon Politics</span>
              </div>
            </div>

            <div className="landing-story-card">
              <div className="landing-story-image">
                <img src="/images/story-3.png" alt="Archmage's tower" className="landing-story-img" />
              </div>
              <div className="landing-story-body">
                <p className="landing-story-quote">
                  I tried to pickpocket the archmage at level 2. I failed, got polymorphed
                  into a chicken, and spent three sessions finding a cure. 10/10 would
                  steal again.
                </p>
                <p className="landing-story-author">-- Rogue, Session 12</p>
                <span className="landing-story-tag">Poultry Consequences</span>
              </div>
            </div>

            <div className="landing-story-card">
              <div className="landing-story-image">
                <img src="/images/story-2.png" alt="A god striking down a warrior" className="landing-story-img" />
              </div>
              <div className="landing-story-body">
                <p className="landing-story-quote">
                  I attacked a god at level 1. One hit. Instant death. No cutscene, no mercy,
                  no second chance. I rolled a new character and never made that mistake again.
                  This game doesn't play around.
                </p>
                <p className="landing-story-author">-- Warrior, Session 3</p>
                <span className="landing-story-tag">Divine Reckoning</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── CTA Footer ─── */}
      <section className="landing-cta-footer">
        <LandingParticles />
        <h2 className="landing-cta-footer-title">Your Story Begins Now</h2>
        <p className="landing-cta-footer-subtitle">
          No downloads. No sign-up required. Step into a world that remembers
          every choice you make.
        </p>
        <Link to="/play" className="landing-cta-btn">
          Start Your Adventure
        </Link>
      </section>

      <div className="landing-divider" />

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <span className="landing-footer-brand">Wanderlore AI</span>
        <div className="landing-footer-links">
          <Link to="/stories">Stories</Link>
          <Link to="/play">Play</Link>
          <a href="#how-it-works">How It Works</a>
        </div>
        <span className="landing-footer-copy">&copy; 2026 Wanderlore AI. All rights reserved.</span>
      </footer>
    </div>
  );
}
