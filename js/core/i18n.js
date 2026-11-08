// =========================================================
// i18n.js — translation system.
// All visible text comes from js/i18n/<lang>.js (UI) and
// js/data/text.<lang>.js (exercise instructions).
// t('nav.home') → text in the current language.
// =========================================================
import { store } from './store.js';
import en from '../i18n/en.js';
import ar from '../i18n/ar.js';
import ckb from '../i18n/ckb.js';
import exEn from '../data/text.en.js';
import exAr from '../data/text.ar.js';
import exCkb from '../data/text.ckb.js';

export const LANGS = {
  en:  { code: 'en',  label: 'English', short: 'EN', dir: 'ltr', ui: en,  ex: exEn,  locale: 'en-GB', speech: ['en-US', 'en-GB', 'en'] },
  ar:  { code: 'ar',  label: 'العربية', short: 'ع',  dir: 'rtl', ui: ar,  ex: exAr,  locale: 'ar-IQ', speech: ['ar-SA', 'ar-IQ', 'ar-EG', 'ar'] },
  ckb: { code: 'ckb', label: 'کوردی',   short: 'کو', dir: 'rtl', ui: ckb, ex: exCkb, locale: 'ckb-IQ', speech: ['ckb-IQ', 'ckb', 'ku-IQ', 'ku'] },
};

export const lang = () => LANGS[store.get().settings.lang] || LANGS.en;

function lookup(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

/** Translate a key. Variables: t('x', { n: 3 }) replaces {n}. Falls back to English. */
export function t(key, vars) {
  let s = lookup(lang().ui, key);
  if (s === undefined) s = lookup(en, key);
  if (s === undefined) { console.warn('Missing translation:', key); return key; }
  if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return s;
}

/** Exercise text (name, steps, mistakes…) in the current language. */
export function ex(id) {
  return lang().ex[id] || exEn[id] || { name: id, muscles: '', start: '', steps: [], breathing: '', mistakes: [], safety: [] };
}

/** Apply direction, lang attribute and fonts for the current language. */
export function applyLanguage() {
  const L = lang();
  document.documentElement.lang = L.code;
  document.documentElement.dir = L.dir;
  document.title = `PRIME FORM — ${t('brand.tagline')}`;
}

export function fmtDate(d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = d instanceof Date ? d : new Date(d);
  for (const loc of [lang().locale, lang().code, 'en-GB']) {
    try { return new Intl.DateTimeFormat(loc, opts).format(date); } catch { /* try next */ }
  }
  return date.toDateString();
}

export function fmtNum(n, digits = 0) {
  // Western digits are used for all languages for clarity (common in Iraq & Kurdistan).
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
