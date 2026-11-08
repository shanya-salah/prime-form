// =========================================================
// achievements.js — badge rules. Checked after every workout.
// =========================================================
import { store } from '../core/store.js';
import { computeStats } from './stats.js';

export const BADGES = [
  { id: 'first', icon: 'sparkles', test: (s) => s.totalWorkouts >= 1 },
  { id: 'five', icon: 'dumbbell', test: (s) => s.totalWorkouts >= 5 },
  { id: 'ten', icon: 'target', test: (s) => s.totalWorkouts >= 10 },
  { id: 'twentyfive', icon: 'trophy', test: (s) => s.totalWorkouts >= 25 },
  { id: 'reps100', icon: 'zap', test: (s) => s.totalReps >= 100 },
  { id: 'reps1000', icon: 'bolt', test: (s) => s.totalReps >= 1000 },
  { id: 'streak3', icon: 'flame', test: (s) => s.bestStreak >= 3 },
  { id: 'streak7', icon: 'flame', test: (s) => s.bestStreak >= 7 },
  { id: 'perfect', icon: 'award', test: (s, ws) => ws.some((w) => (w.formScore || 0) >= 90 && (w.totalReps || 0) > 0) },
  { id: 'explorer', icon: 'globe', test: (s) => s.distinctExercises >= 5 },
  { id: 'hour', icon: 'clock', test: (s) => s.totalSec >= 3600 },
  { id: 'early', icon: 'sun', test: (s, ws) => ws.some((w) => new Date(w.endedAt || w.date).getHours() < 8) },
];

/** Unlock any new badges. Returns the list of newly unlocked badge ids. */
export function checkAchievements() {
  const state = store.get();
  const stats = computeStats(state.workouts);
  const fresh = [];
  for (const b of BADGES) {
    if (!state.achievements[b.id] && b.test(stats, state.workouts)) fresh.push(b.id);
  }
  if (fresh.length) {
    store.update((s) => { fresh.forEach((id) => (s.achievements[id] = new Date().toISOString())); }, 'achievements');
  }
  return fresh;
}
