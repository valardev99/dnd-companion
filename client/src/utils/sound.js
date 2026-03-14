// ═══════════════════════════════════════════════════════════════
// SOUND — Notification sound effects via Web Audio API
// ═══════════════════════════════════════════════════════════════

export function playNotificationSound(style) {
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
}
