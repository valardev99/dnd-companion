import React, { useRef, useEffect } from 'react';

function ParticleBackground() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const runes = ['\u2295','\u2297','\u25B3','\u25C7','\u263D','\u27D0','\u22B9','\u2727','\u25C8','\u27E1','\u229B','\u27C1'];
    const count = 40;

    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: 8 + Math.random() * 14,
      opacity: 0.05 + Math.random() * 0.15,
      rune: runes[Math.floor(Math.random() * runes.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.015,
    }));

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles.current) {
        p.x += p.vx; p.y += p.vy; p.pulse += p.pulseSpeed;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
        ctx.fillText(p.rune, p.x, p.y);
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

export default ParticleBackground;
