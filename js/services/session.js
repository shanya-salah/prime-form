// =========================================================
// session.js — holds the workout plan between the setup form
// and the live workout screen (kept in sessionStorage so a page
// refresh does not lose it).
// =========================================================
const KEY = 'primeform:plan';

export function setPlan(plan) { sessionStorage.setItem(KEY, JSON.stringify(plan)); }
export function getPlan() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } }
export function clearPlan() { sessionStorage.removeItem(KEY); }
