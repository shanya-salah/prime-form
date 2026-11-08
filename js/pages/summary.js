// =========================================================
// summary.js — workout completion screen with celebration.
// =========================================================
import { h, fmtTime } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex, fmtNum, fmtDate } from '../core/i18n.js';
import { store, toDisplayWeight, unitLabel } from '../core/store.js';
import { emptyState, ring } from '../core/ui.js';
import { BADGES } from '../services/achievements.js';
import { fbText } from './exercise.js';

function confetti() {
  if (store.get().settings.reduceMotion) return () => {};
  const c = h('canvas', { class: 'confetti' });
  document.body.append(c);
  const g = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#E9D29C', '#CFAE66', '#FFFFFF', '#22C55E', '#C6FF00'];
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[(Math.random() * cols.length) | 0],
  }));
  let raf, frames = 0;
  const step = () => {
    g.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
    }
    if (++frames < 220) raf = requestAnimationFrame(step); else c.remove();
  };
  step();
  return () => { cancelAnimationFrame(raf); c.remove(); };
}

export default {
  shot: 'history',
  render(root, { id }, query) {
    const w = store.get().workouts.find((x) => x.id === id);
    const page = h('div', { class: 'page' });
    if (!w) { page.append(h('div', { class: 'glass' }, emptyState('history', t('summary.notFound'), '', h('a', { class: 'btn btn-primary', href: '#/history' }, t('nav.history'))))); root.append(page); return; }

    const tile = (ic, label, value, unit) => h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon(ic, 'sm'), label), h('div', { class: 'value' }, value, unit ? h('small', {}, unit) : null));
    const setsDone = w.items.reduce((a, i) => a + i.sets.length, 0);
    const issues = {};
    w.items.forEach((i) => Object.entries(i.issues || {}).forEach(([k, n]) => (issues[k] = (issues[k] || 0) + n)));
    const top = Object.entries(issues).sort((a, b) => b[1] - a[1])[0];
    const fresh = (query.new || '').split(',').filter(Boolean);

    page.append(
      h('div', { class: 'glass summary-hero' },
        h('div', { class: 'trophy' }, icon('trophy')),
        h('div', { class: 'eyebrow' }, fmtDate(w.date, { weekday: 'long', day: 'numeric', month: 'long' })),
        h('h1', { class: 'display metal page-title', style: { marginTop: '8px' } }, t('summary.title')),
        h('p', { class: 'page-sub', style: { margin: '10px auto 0' } }, t('summary.sub', { name: w.name || t('summary.athlete') }))),
      h('div', { class: 'grid c4', style: { margin: '18px 0' } },
        tile('repeat', t('summary.reps'), fmtNum(w.totalReps)),
        tile('clock', t('summary.duration'), fmtTime(w.durationSec)),
        tile('list', t('summary.sets'), setsDone),
        tile('flame', t('summary.calories'), fmtNum(w.calories), 'kcal')),
    );

    const left = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('target'), t('summary.score')),
      h('div', { style: { display: 'grid', placeItems: 'center', gap: '10px' } },
        w.formScore === null ? h('p', { class: 'muted' }, t('summary.manual'))
          : ring(w.formScore / 100, 170, 13, [h('b', { style: { fontFamily: 'Anton, var(--font-display)', fontSize: '2.6rem', display: 'block' } }, `${w.formScore}%`), h('span', { class: 'muted small' }, t('summary.ai'))]),
        h('div', { class: `notice ${top ? 'warn' : 'ok'}`, style: { width: '100%' } }, icon(top ? 'alert' : 'check'),
          h('div', {}, h('b', {}, t('summary.issue')), h('div', {}, top ? fbText(top[0]) : t('summary.noIssue'))))));

    const right = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('chart'), t('summary.perSet')),
      ...w.items.map((it) => {
        const max = Math.max(1, ...it.sets.map((s) => (it.hold ? s.holdSec : s.reps)), it.repsPlanned);
        const bars = h('div', { class: 'set-bars' }, ...it.sets.map((s, i) => {
          const v = it.hold ? s.holdSec : s.reps;
          const bar = h('i');
          requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.height = `${(v / max) * 100}%`)));
          return h('div', {}, h('b', { class: 'small' }, `${v}${it.hold ? t('common.sec') : ''}`), bar, h('span', {}, `#${i + 1}`));
        }));
        return h('div', { style: { marginBottom: '18px' } },
          h('div', { class: 'row between' }, h('b', {}, ex(it.exId).name), h('span', { class: 'muted small' }, it.weightKg ? `${toDisplayWeight(it.weightKg)} ${unitLabel()}` : t('equip.none'))),
          bars);
      }));
    page.append(h('div', { class: 'grid c2' }, left, right));

    if (fresh.length) {
      page.append(h('div', { class: 'glass card', style: { marginTop: '18px' } }, h('div', { class: 'card-title' }, icon('award'), t('summary.badges')),
        h('div', { class: 'badge-grid' }, ...fresh.map((b) => {
          const def = BADGES.find((x) => x.id === b);
          const [name, desc] = t('badges.' + b);
          return h('div', { class: 'ach on' }, h('div', { class: 'medal' }, icon(def?.icon || 'award')), h('b', {}, name), h('span', {}, desc));
        }))));
    }
    page.append(h('p', { class: 'hint', style: { margin: '16px 0' } }, `${t('summary.saved')} ${t('summary.caloriesNote')}`),
      h('div', { class: 'cta-bar' },
        h('a', { class: 'btn btn-primary', href: '#/progress' }, icon('chart', 'sm'), t('summary.progress')),
        h('a', { class: 'btn btn-ghost', href: `#/setup?${w.program ? 'program=' + w.program : 'ex=' + w.items[0].exId}` }, icon('repeat', 'sm'), t('summary.again')),
        h('a', { class: 'btn btn-ghost', href: '#/' }, t('summary.home'))));
    root.append(page);
    const stop = query.new !== undefined || Date.now() - new Date(w.endedAt).getTime() < 15000 ? confetti() : () => {};
    return stop;
  },
};
