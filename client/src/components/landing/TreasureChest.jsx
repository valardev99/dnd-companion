import React, { useRef, useState, useEffect } from 'react';

const SESSION_KEY = 'wonderlore-chest-opened';

export default function TreasureChest() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [opened, setOpened] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = mq.matches;
    setReducedMotion(isReduced);

    // Check sessionStorage
    const alreadyOpened = sessionStorage.getItem(SESSION_KEY) === 'true';

    if (isReduced || alreadyOpened) {
      setVisible(true);
      setOpened(true);
      return;
    }

    // Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            // Small delay then open
            setTimeout(() => {
              setOpened(true);
              sessionStorage.setItem(SESSION_KEY, 'true');
            }, 300);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`chest-cta${visible ? ' chest-visible' : ''}${opened ? ' chest-opened' : ''}${reducedMotion ? ' chest-no-motion' : ''}`}
    >
      <div className="chest-wrapper">
        <div className="chest-glow" />
        <div className="chest-body">
          <div className="chest-lid">
            <div className="chest-lid-front" />
          </div>
          <div className="chest-base">
            <div className="chest-base-front" />
          </div>
        </div>
        <div className="chest-rays" />
      </div>
      <div className="chest-content">
        <h2 className="chest-title">Your Story Begins Now</h2>
        <p className="chest-subtitle">No downloads. No paywalls. Free to play.</p>
        <a href="/play" className="btn-premium chest-btn">CLAIM YOUR DESTINY</a>
      </div>
    </div>
  );
}
