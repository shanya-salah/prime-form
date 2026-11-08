// =========================================================
// stats.js — turns the saved workout list into numbers for
// the dashboard, progress charts, records and badges.
//
// A saved workout looks like:
// { id, date, endedAt, durationSec, name, bodyWeightKg, difficulty, program,
//   items: [{ exId, repsPlanned, setsPlanned, hold, weightKg,
//             sets: [{ reps, holdSec, formScore, manual }], issues: { fbKey: count } }],
//   totalReps, formScore, calories }
// =========================================================
import { store } from '../core/store.js';
import { byId, EXERCISES, CATEGORIES } from '../data/exercises.js';

export const dayKey = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const DAY = 86400000;

/** Monday 00:00 of the week containing d */
export function weekStart(d = new Date()) {
  const x = startOfDay(d);
  const wd = (x.getDay() + 6) % 7; // Monday = 0
  return new Date(x.getTime() - wd * DAY);
}

export function computeStats(workouts = store.get().workouts) {
  const now = new Date();
  const today = dayKey(now);
  const days = new Map(); // dayKey → number of workouts
  const byEx = {};
  let totalReps = 0, totalSec = 0, repsToday = 0, secToday = 0, scoreSum = 0, scoreN = 0;
  const wkStart = weekStart(now).getTime();
  let weekCount = 0;

  for (const w of workouts) {
    const k = dayKey(w.date);
    days.set(k, (days.get(k) || 0) + 1);
    totalReps += w.totalReps || 0;
    totalSec += w.durationSec || 0;
    if (k === today) { repsToday += w.totalReps || 0; secToday += w.durationSec || 0; }
    if (new Date(w.date).getTime() >= wkStart) weekCount++;
    if (typeof w.formScore === 'number') { scoreSum += w.formScore; scoreN++; }
    for (const it of w.items || []) {
      const e = (byEx[it.exId] ||= { reps: 0, sets: 0, holdSec: 0, maxWeight: 0, maxReps: 0, maxHold: 0, sessions: 0, loadHistory: [] });
      e.sessions++;
      for (const s of it.sets || []) {
        e.sets++;
        e.reps += s.reps || 0;
        e.holdSec += s.holdSec || 0;
        e.maxReps = Math.max(e.maxReps, s.reps || 0);
        e.maxHold = Math.max(e.maxHold, s.holdSec || 0);
      }
      if ((it.sets || []).length) {
        e.maxWeight = Math.max(e.maxWeight, it.weightKg || 0);
        e.loadHistory.push({ date: w.date, kg: it.weightKg || 0 });
      }
    }
  }

  // streaks (consecutive days)
  const sortedDays = [...days.keys()].sort();
  let best = 0, run = 0, prev = null;
  for (const k of sortedDays) {
    const d = new Date(k + 'T00:00:00');
    run = prev && (d - prev) / DAY === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let streak = 0;
  {
    let cursor = startOfDay(now);
    if (!days.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY); // yesterday still counts
    while (days.has(dayKey(cursor))) { streak++; cursor = new Date(cursor.getTime() - DAY); }
  }

  // workouts per week for the last 8 weeks
  const weekly = [];
  for (let i = 7; i >= 0; i--) {
    const start = weekStart(now).getTime() - i * 7 * DAY;
    const end = start + 7 * DAY;
    weekly.push({ start: new Date(start), count: workouts.filter((w) => { const t = new Date(w.date).getTime(); return t >= start && t < end; }).length });
  }

  return {
    totalWorkouts: workouts.length, totalReps, totalSec, repsToday, minutesToday: Math.round(secToday / 60),
    weekCount, streak, bestStreak: best, days, byEx, weekly,
    avgScore: scoreN ? Math.round(scoreSum / scoreN) : null,
    distinctExercises: Object.keys(byEx).length,
  };
}

/** Recommend exercises: right level + muscle groups trained least in the last 7 days. */
export function recommend(count = 6) {
  const { profile, workouts, favorites } = store.get();
  const level = profile.level || 'beginner';
  const allowed = level === 'beginner' ? ['beginner'] : level === 'intermediate' ? ['beginner', 'intermediate'] : ['beginner', 'intermediate', 'advanced'];
  const since = Date.now() - 7 * DAY;
  const catLoad = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const w of workouts) {
    if (new Date(w.date).getTime() < since) continue;
    for (const it of w.items || []) (byId[it.exId]?.cats || []).forEach((c) => (catLoad[c] += 1));
  }
  const score = (e) => {
    const least = Math.min(...e.cats.map((c) => catLoad[c]));
    const levelBonus = e.diff === level ? -0.5 : 0;
    const fav = favorites.includes(e.id) ? -0.3 : 0;
    return least + levelBonus + fav;
  };
  // deterministic daily shuffle so the list changes each day but not on every render
  const seed = Number(dayKey(new Date()).replace(/-/g, ''));
  const jitter = (id) => ((seed * 9301 + id.length * 49297 + id.charCodeAt(0) * 233) % 233280) / 233280 * 0.4;
  return EXERCISES.filter((e) => allowed.includes(e.diff))
    .sort((a, b) => score(a) + jitter(a.id) - (score(b) + jitter(b.id)))
    .slice(0, count);
}

/** Calorie ESTIMATE: MET × body weight (kg) × hours. */
export function estimateCalories(met, bodyKg, seconds) {
  const kg = bodyKg || 70;
  return Math.round(met * kg * (seconds / 3600));
}
