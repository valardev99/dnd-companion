import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { playNotificationSound } from '../../utils/sound.js';

function NotificationOverlay() {
  const { state, dispatch } = useGame();
  const [visible, setVisible] = useState([]);
  const processedRef = useRef(new Set());
  const timersRef = useRef([]);

  // Stagger new notifications in with 1s delay between each
  useEffect(() => {
    const newOnes = state.notifications.filter(n => !processedRef.current.has(n.id));
    newOnes.forEach((n, i) => {
      processedRef.current.add(n.id);
      // Stagger: 1s delay between each notification appearing
      const showTimer = setTimeout(() => {
        setVisible(prev => [...prev, { ...n, phase: 'entering' }]);
        // After 1.5s fade-in, switch to visible
        const visibleTimer = setTimeout(() => {
          setVisible(prev => prev.map(v => v.id === n.id ? { ...v, phase: 'visible' } : v));
        }, 1500);
        // After 6s visible, start 1.5s fade-out
        const exitTimer = setTimeout(() => {
          setVisible(prev => prev.map(v => v.id === n.id ? { ...v, phase: 'exiting' } : v));
        }, 7500);
        // After fade-out completes, remove entirely
        const removeTimer = setTimeout(() => {
          setVisible(prev => prev.filter(v => v.id !== n.id));
          processedRef.current.delete(n.id);
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: n.id });
        }, 9000);
        timersRef.current.push(visibleTimer, exitTimer, removeTimer);
      }, i * 1000);
      timersRef.current.push(showTimer);
    });
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  }, [state.notifications]);

  // Play notification sound cue
  const playSound = useCallback((style) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      if (style === 'critical') { osc.frequency.value = 180; osc.type = 'sawtooth'; }
      else if (style === 'success') { osc.frequency.value = 660; osc.type = 'sine'; }
      else if (style === 'arcane') { osc.frequency.value = 440; osc.type = 'triangle'; }
      else { osc.frequency.value = 520; osc.type = 'sine'; }
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
  }, []);

  // Play sound when new notification enters
  useEffect(() => {
    const entering = visible.filter(v => v.phase === 'entering');
    entering.forEach(n => playSound(n.style));
  }, [visible.length]);

  return (
    <div className="notification-overlay">
      {visible.map(n => (
        <div key={n.id} className={`system-notification ${n.style || ''} notif-${n.phase}`}>
          <div className="notification-border">═══════════════════════════════</div>
          <div className="notification-title">{n.title}</div>
          <div className="notification-body">{n.body}</div>
          {n.statChanges && (
            <div className="notification-stat-change">
              {n.statChanges.map((s, i) => (
                <div key={i} className="stat-change-line">
                  <span className="stat-change-name">{s.stat}</span>
                  <span className={`stat-change-value ${s.dir}`}>{s.from} → {s.to}</span>
                </div>
              ))}
            </div>
          )}
          <div className="notification-border">═══════════════════════════════</div>
        </div>
      ))}
    </div>
  );
}

export default NotificationOverlay;
