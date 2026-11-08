// =========================================================
// progress.js — KPIs, charts, consistency heat-map,
// personal records and achievement badges.
// =========================================================
import { h, fmtTime } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex, fmtDate, fmtNum } from '../core/i18n.js';
import { store, toDisplayWeight, fromDisplayWeight, unitLabel } from '../core/store.js';
import { pageHead, toast, emptyState } from '../core/ui.js';
import { computeStats, dayKey, weekStart } from '../services/stats.js';
import { BADGES } from '../services/achievements.js';
import { lineChart, barChart, hbarChart, hideTip } from '../components/charts.js';
import { byId } from '../data/exercises.js';

export default {
  shot: 'progress',
  render(root) {
    const page = h('div', { class: 'page wide' });
    root.append(page);
    const draw = () => {
      page.innerHTML = '';
      const st = store.get();
      const S = computeStats(st.workouts);
      page.append(pageHead(t('progress.title'), t('progress.sub'), h('a', { class: 'btn btn-ghost', href: '#/history' }, icon('history', 'sm'), t('nav.history'))));

      const kpi = (ic, label, value, sub) => h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon(ic, 'sm'), label), h('div', { class: 'value' }, value), sub ? h('div', { class: 'hint' }, sub) : null);
      page.append(h('div', { class: 'grid c4 kpis' },
        kpi('dumbbell', t('progress.workouts'), fmtNum(S.totalWorkouts)),
        kpi('repeat', t('progress.reps'), fmtNum(S.totalReps)),
        kpi('clock', t('progress.time'), fmtTime(S.totalSec)),
        kpi('flame', t('progress.streak'), `${S.streak}`, t('progress.best', { n: S.bestStreak }))));

      // ---- body weight ----
      const wIn = h('input', { class: 'input', type: 'number', min: 1, step: 0.1, placeholder: unitLabel(), style: { width: '120px', height: '40px' }, 'aria-label': t('progress.weight') });
      const addW = h('button', { class: 'btn btn-primary sm' }, icon('plus', 'sm'), t('progress.addWeight'));
      addW.addEventListener('click', () => {
        const kg = fromDisplayWeight(wIn.value);
        if (!(kg >= 20 && kg <= 350)) { toast(t('setup.errors.weight'), 'error'); wIn.setAttribute('aria-invalid', 'true'); return; }
        store.update((s) => { s.weights.push({ date: new Date().toISOString(), kg: Math.round(kg * 10) / 10 }); s.profile.weightKg = Math.round(kg * 10) / 10; }, 'weight');
        toast(t('progress.logged'), 'success'); draw();
      });
      const weights = st.weights.slice(-20);
      const weightCard = h('div', { class: 'glass card' },
        h('div', { class: 'row between wrap', style: { marginBottom: '10px' } }, h('div', { class: 'card-title', style: { margin: 0 } }, icon('scale'), `${t('progress.weight')} (${unitLabel()})`), h('div', { class: 'row' }, wIn, addW)),
        weights.length >= 1 ? lineChart(weights.map((w) => ({ label: fmtDate(w.date, { day: 'numeric', month: 'short' }), value: toDisplayWeight(w.kg), tip: `${fmtDate(w.date)}: ${toDisplayWeight(w.kg)} ${unitLabel()}` })), { caption: t('progress.weight') })
          : emptyState('scale', t('progress.noData'), ''));

      // ---- workouts per week ----
      const weeklyCard = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('chart'), t('progress.weekly')),
        barChart(S.weekly.map((w) => ({ label: fmtDate(w.start, { day: 'numeric', month: 'short' }), value: w.count, tip: `${fmtDate(w.start, { day: 'numeric', month: 'short' })}: ${t('history.count', { n: w.count })}` })), { caption: t('progress.weekly') }));
      page.append(h('div', { class: 'grid c2' }, weightCard, weeklyCard));

      // ---- reps by exercise + load over time ----
      const exEntries = Object.entries(S.byEx).sort((a, b) => b[1].reps + b[1].holdSec - (a[1].reps + a[1].holdSec));
      const repsCard = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('activity'), t('progress.byEx')),
        exEntries.length ? hbarChart(exEntries.slice(0, 8).map(([id, v]) => byId[id]?.hold
          ? { label: ex(id).name, value: v.holdSec, tip: `${ex(id).name}: ${v.holdSec}${t('common.sec')}` }
          : { label: ex(id).name, value: v.reps }), { caption: t('progress.byEx') }) : emptyState('activity', t('progress.noData'), ''));

      const loadable = exEntries.filter(([id, v]) => v.loadHistory.some((l) => l.kg > 0));
      const loadSel = h('select', { class: 'select', style: { width: 'auto', height: '40px' }, 'aria-label': t('progress.select') }, ...loadable.map(([id]) => h('option', { value: id }, ex(id).name)));
      const loadChartBox = h('div');
      const drawLoad = () => {
        loadChartBox.innerHTML = '';
        const e = S.byEx[loadSel.value];
        if (!e) { loadChartBox.append(emptyState('dumbbell', t('progress.noData'), '')); return; }
        loadChartBox.append(lineChart(e.loadHistory.map((l) => ({ label: fmtDate(l.date, { day: 'numeric', month: 'short' }), value: toDisplayWeight(l.kg), tip: `${fmtDate(l.date)}: ${toDisplayWeight(l.kg)} ${unitLabel()}` })), { caption: t('progress.load'), min: 0 }));
      };
      loadSel.addEventListener('change', drawLoad);
      const loadCard = h('div', { class: 'glass card' }, h('div', { class: 'row between wrap', style: { marginBottom: '10px' } }, h('div', { class: 'card-title', style: { margin: 0 } }, icon('dumbbell'), `${t('progress.load')} (${unitLabel()})`), loadable.length ? loadSel : null), loadChartBox);
      drawLoad();
      page.append(h('div', { class: 'grid c2', style: { marginTop: '18px' } }, repsCard, loadCard));

      // ---- consistency heat-map (12 weeks × 7 days) ----
      const start = new Date(weekStart().getTime() - 11 * 7 * 86400000);
      const todayK = dayKey(new Date());
      const cols = [];
      for (let w = 0; w < 12; w++) {
        const col = h('div', { class: 'col' });
        for (let d = 0; d < 7; d++) {
          const day = new Date(start.getTime() + (w * 7 + d) * 86400000);
          const k = dayKey(day), n = S.days.get(k) || 0;
          const future = k > todayK;
          col.append(h('div', { class: `c ${n >= 2 ? 'l2' : n === 1 ? 'l1' : ''} ${future ? 'future' : ''}`, title: `${fmtDate(day)}: ${t('history.count', { n })}` }));
        }
        cols.push(col);
      }
      const heatCard = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('calendar'), t('progress.consistency')),
        h('div', { class: 'heat', role: 'img', 'aria-label': t('progress.consistency') }, ...cols),
        h('div', { class: 'legend' }, t('progress.less'), h('i'), h('i', { class: 'l1' }), h('i', { class: 'l2' }), t('progress.more')));

      // ---- personal records ----
      const rows = exEntries.map(([id, v]) => h('tr', {},
        h('td', {}, ex(id).name),
        h('td', {}, v.maxWeight ? `${toDisplayWeight(v.maxWeight)} ${unitLabel()}` : '—'),
        h('td', {}, byId[id]?.hold ? `${v.maxHold}${t('common.sec')}` : v.maxReps),
        h('td', {}, v.sessions)));
      const recCard = h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('trophy'), t('progress.records')),
        rows.length ? h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', {}, t('progress.exercise')), h('th', {}, t('progress.heaviest')), h('th', {}, t('progress.mostReps')), h('th', {}, t('progress.workouts')))),
          h('tbody', {}, ...rows))) : emptyState('trophy', t('progress.noData'), ''));
      page.append(h('div', { class: 'grid c2', style: { marginTop: '18px' } }, heatCard, recCard));

      // ---- achievements ----
      page.append(h('div', { class: 'glass card', style: { marginTop: '18px' } }, h('div', { class: 'card-title' }, icon('award'), t('progress.achievements')),
        h('div', { class: 'badge-grid' }, ...BADGES.map((b) => {
          const when = st.achievements[b.id];
          const [name, desc] = t('badges.' + b.id);
          return h('div', { class: `ach ${when ? 'on' : ''}` }, h('div', { class: 'medal' }, icon(when ? b.icon : 'lock')), h('b', {}, name), h('span', {}, desc),
            h('div', { class: 'hint', style: { marginTop: '6px' } }, when ? t('progress.unlocked', { date: fmtDate(when) }) : t('progress.locked')));
        }))));
    };
    draw();
    return hideTip;
  },
};
