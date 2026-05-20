import { useRef, useCallback } from "react";
import { ALERT_SOUNDS } from "../constants";

// AUDIO ALERTS HOOK
// Uses the browser's Web Audio API to play beep tones.
// No external library needed — works offline, which matters for an in-car system.
//
// Returns a single `playAlert(level)` function.
// Call it with "warning", "alert", or "critical".

export function useAudioAlerts() {
  const ctxRef = useRef(null);

  // AudioContext must be created after a user gesture (browser policy).
  // It's lazily initialized on first call to playAlert.
  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playAlert = useCallback((level) => {
    const cfg = ALERT_SOUNDS[level];
    if (!cfg) return;

    const ctx = getCtx();

    for (let i = 0; i < cfg.pulses; i++) {
      const offset = i * 0.35; // stagger each pulse by 350ms

      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);

      // Fade in quickly, then fade out
      gain.gain.setValueAtTime(0, ctx.currentTime + offset);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + offset + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + offset + cfg.duration);

      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + cfg.duration + 0.05);
    }
  }, []);

  return playAlert;
}