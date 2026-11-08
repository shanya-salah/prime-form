// =========================================================
// voice.js — spoken coaching with the browser's built-in
// SpeechSynthesis API (no internet or API key needed).
// If the device has no voice for the chosen language (common
// for Kurdish), we return false and the UI shows text instead.
// =========================================================
import { store } from '../core/store.js';
import { lang } from '../core/i18n.js';

let voices = [];
let lastSpoken = { text: '', at: 0 };
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;

function loadVoices() { voices = synth ? synth.getVoices() : []; }
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export const speechSupported = () => !!synth;

/** All installed voices that match the current language. */
export function voicesForLang(code = lang().code) {
  loadVoices();
  const prefixes = code === 'ckb' ? ['ckb', 'ku'] : [code];
  return voices.filter((v) => prefixes.some((p) => v.lang.toLowerCase().replace('_', '-').startsWith(p)));
}

function pickVoice() {
  const list = voicesForLang();
  const wanted = store.get().settings.voiceName;
  return list.find((v) => v.name === wanted) || list.find((v) => v.localService) || list[0] || null;
}

export function hasVoice() { return !!pickVoice(); }

/**
 * Speak a sentence. Returns true if it was spoken, false if not (no voice / disabled / throttled).
 *   priority: 'high' interrupts what is being said (rep counts, set done)
 */
export function speak(text, { priority = 'normal', minGap = 2500, force = false } = {}) {
  if (!synth || !text) return false;
  if (!force && !store.get().settings.voice) return false;
  const voice = pickVoice();
  if (!voice) return false;
  const now = Date.now();
  if (priority !== 'high' && (synth.speaking || now - lastSpoken.at < minGap)) return false;
  if (text === lastSpoken.text && now - lastSpoken.at < 6000 && priority !== 'high') return false;
  if (priority === 'high') synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = store.get().settings.voiceRate || 1;
  u.volume = 1;
  synth.speak(u);
  lastSpoken = { text, at: now };
  return true;
}

export function stopSpeaking() { synth?.cancel(); }
