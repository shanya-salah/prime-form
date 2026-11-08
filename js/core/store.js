// =========================================================
// store.js — all app data lives here and is saved in the
// browser's localStorage.
//
// IMPORTANT (honest storage note):
//   localStorage keeps data on THIS browser on THIS device.
//   It survives refresh and restarts, but it is deleted if you
//   clear browser data, use a private window, or switch browser.
//   Use Settings → Data → "Export backup" to keep a copy.
// =========================================================

const KEY = 'primeform:v1';
const listeners = new Set();

const defaults = () => ({
  version: 1,
  onboarded: false,
  settings: {
    lang: 'en',               // 'en' | 'ar' | 'ckb'
    theme: 'dark',            // 'dark' | 'light'
    accent: 'gold',           // 'gold' (video) | 'lime' (original brief)
    units: 'kg',              // 'kg' | 'lb'
    sound: true,              // beeps for reps / timers
    soundVolume: 0.6,
    voice: true,              // spoken coaching
    voiceRate: 1,
    voiceName: '',            // chosen system voice (empty = automatic)
    voiceEvery: 'smart',      // 'smart' | 'reps' | 'corrections'
    defaultSets: 3,
    defaultReps: 12,
    defaultRest: 60,
    difficulty: 'beginner',
    countdown: 5,             // seconds before a set starts
    mirrorCamera: true,
    showSkeleton: true,
    background: '3d',         // '3d' | 'photos' | 'off'
    largeText: false,
    highContrast: false,
    reduceMotion: false,
  },
  profile: {
    name: '',
    weightKg: null,
    heightCm: null,
    goal: 'fitness',          // 'fitness' | 'strength' | 'fat' | 'muscle'
    level: 'beginner',
    dailyRepsGoal: 100,
    dailyMinutesGoal: 20,
  },
  workouts: [],               // finished workouts (see services/stats.js)
  weights: [],                // [{ date: ISO, kg: number }]
  favorites: [],              // exercise ids
  achievements: {},           // { badgeId: ISO date unlocked }
  spotify: { clientId: '' },  // client ID is public — never put a client SECRET here
});

function deepMerge(base, extra) {
  if (!extra || typeof extra !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else out[k] = v;
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? deepMerge(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) {
    console.warn('Could not read saved data, starting fresh.', e);
    return defaults();
  }
}

let state = load();
export let storageOk = true;

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch (e) {
    storageOk = false;
    console.warn('Could not save data (storage full or blocked).', e);
  }
}

export const store = {
  get: () => state,
  /** Change data with a function, then save and notify listeners. */
  update(fn, reason = 'update') {
    fn(state);
    save();
    listeners.forEach((l) => l(state, reason));
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  exportJSON: () => JSON.stringify(state, null, 2),
  importJSON(text) {
    const parsed = JSON.parse(text); // throws if invalid → caller shows an error
    if (!parsed || typeof parsed !== 'object' || !('settings' in parsed)) throw new Error('Not a PRIME FORM backup');
    state = deepMerge(defaults(), parsed);
    save();
    listeners.forEach((l) => l(state, 'import'));
  },
  reset() {
    const keepLang = state.settings.lang;
    state = defaults();
    state.settings.lang = keepLang;
    save();
    listeners.forEach((l) => l(state, 'reset'));
  },
};

// ---------- Units (kg / lb) ----------
export const KG_PER_LB = 0.45359237;
export function toDisplayWeight(kg) {
  if (kg === null || kg === undefined || kg === '') return '';
  const v = state.settings.units === 'lb' ? kg / KG_PER_LB : kg;
  return Math.round(v * 10) / 10;
}
export function fromDisplayWeight(v) {
  const n = Number(v);
  return state.settings.units === 'lb' ? n * KG_PER_LB : n;
}
export const unitLabel = () => (state.settings.units === 'lb' ? 'lb' : 'kg');
