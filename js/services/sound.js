// =========================================================
// sound.js — short beeps made with the Web Audio API
// (no sound files needed).
// =========================================================
import { store } from '../core/store.js';

let ctx = null;
function audio() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Play a tone. kind: 'rep' | 'tick' | 'go' | 'done' | 'warn' */
export function beep(kind = 'rep', force = false) {
  const s = store.get().settings;
  if (!force && !s.sound) return;
  const a = audio(); if (!a) return;
  const presets = {
    rep: [[880, 0.08]], tick: [[660, 0.06]], go: [[660, 0.1], [990, 0.18]],
    done: [[523, 0.12], [659, 0.12], [784, 0.25]], warn: [[300, 0.15]],
  };
  let t = a.currentTime;
  for (const [freq, dur] of presets[kind] || presets.rep) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.25 * (s.soundVolume ?? 0.6)), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
    t += dur * 0.9;
  }
}

/** Browsers only allow audio after a click — call this from a click handler. */
export function unlockAudio() { audio(); }
