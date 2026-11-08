// =========================================================
// quickTools.js — the gold round button in the corner
// (like the one in the video): rest timer + coach tip + help.
// =========================================================
import { h, fmtTime } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/i18n.js';
import { store } from '../core/store.js';
import { beep, unlockAudio } from '../services/sound.js';
import { speak } from '../ai/voice.js';
import { toast } from '../core/ui.js';

let panel, fab, endAt = 0, timerId = 0, chosen = 60;

function build() {
  const root = document.getElementById('quick-root');
  root.innerHTML = '';
  const timeEl = h('div', { class: 'time' }, fmtTime(endAt ? Math.max(0, (endAt - Date.now()) / 1000) : chosen));
  const startBtn = h('button', { class: 'btn btn-primary sm' }, icon(endAt ? 'pause' : 'play', 'sm'), endAt ? t('common.cancel') : t('quick.start'));
  const presets = h('div', { class: 'row wrap' }, ...[30, 60, 90, 120].map((s) =>
    h('button', { class: 'chip', 'aria-pressed': String(s === chosen), onclick: () => { chosen = s; stop(); build(); panel.classList.add('open'); } }, `${s}${t('common.sec')}`)));
  startBtn.addEventListener('click', () => { unlockAudio(); endAt ? stop() : start(); build(); panel.classList.add('open'); });
  const tips = t('quick.tips');
  panel = h('div', { class: 'quick-panel', role: 'dialog', 'aria-label': t('quick.title') },
    h('div', { class: 'row between' }, h('b', {}, t('quick.title')), h('button', { class: 'icon-btn', 'aria-label': t('common.close'), onclick: () => panel.classList.remove('open') }, icon('x', 'sm'))),
    h('div', { class: 'eyebrow', style: { marginTop: '12px' } }, t('quick.timer')),
    h('div', { class: 'qt-timer' }, timeEl, startBtn),
    presets,
    h('hr', { class: 'hr' }),
    h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, t('quick.tip')),
    h('p', { class: 'small muted' }, tips[new Date().getHours() % tips.length]),
    h('a', { class: 'btn btn-text', href: '#/help', onclick: () => panel.classList.remove('open') }, icon('help', 'sm'), t('quick.help')));
  fab = h('button', { class: 'fab', 'aria-label': t('quick.title'), 'aria-haspopup': 'dialog', onclick: () => panel.classList.toggle('open') }, icon(endAt ? 'timer' : 'message'));
  root.append(panel, fab);
  panel._time = timeEl;
}

function start() {
  endAt = Date.now() + chosen * 1000;
  clearInterval(timerId);
  timerId = setInterval(() => {
    const left = Math.max(0, (endAt - Date.now()) / 1000);
    if (panel?._time) panel._time.textContent = fmtTime(Math.ceil(left));
    if (left <= 3 && left > 0) beep('tick');
    if (left <= 0) { stop(); beep('done'); speak(t('quick.done'), { priority: 'high' }); toast(t('quick.done'), 'success'); build(); }
  }, 1000);
}
function stop() { endAt = 0; clearInterval(timerId); }

export function initQuickTools() {
  build();
  let lang = store.get().settings.lang;
  store.subscribe((s) => { if (s.settings.lang !== lang) { lang = s.settings.lang; build(); } });
  document.addEventListener('click', (e) => { if (panel && !panel.contains(e.target) && !fab.contains(e.target)) panel.classList.remove('open'); });
}
