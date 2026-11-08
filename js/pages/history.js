// =========================================================
// history.js — list of past workouts + monthly calendar.
// =========================================================
import { h, fmtTime } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex, fmtDate } from '../core/i18n.js';
import { store } from '../core/store.js';
import { pageHead, emptyState, confirmDialog, toast } from '../core/ui.js';
import { computeStats, dayKey } from '../services/stats.js';

let monthOffset = 0;

export default {
  shot: 'history',
  render(root) {
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(t('history.title'), t('history.sub'), h('a', { class: 'btn btn-primary', href: '#/setup' }, icon('play', 'sm'), t('nav.startWorkout'))));
    const listBox = h('div', { class: 'glass' });
    const calBox = h('div', { class: 'glass card' });
    page.append(h('div', { class: 'hist-layout' }, listBox, calBox));
    root.append(page);

    function drawList() {
      const ws = [...store.get().workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
      listBox.innerHTML = '';
      if (!ws.length) { listBox.append(emptyState('history', t('history.emptyT'), t('history.emptyX'), h('a', { class: 'btn btn-primary', href: '#/setup' }, t('nav.startWorkout')))); return; }
      ws.forEach((w) => {
        const d = new Date(w.date);
        const names = w.items.map((i) => ex(i.exId).name).join(', ');
        const sc = w.formScore;
        const del = h('button', { class: 'icon-btn', 'aria-label': t('common.delete') }, icon('trash', 'sm'));
        del.addEventListener('click', async () => {
          if (await confirmDialog({ title: t('history.delTitle'), message: t('history.delText'), confirmText: t('common.delete'), danger: true })) {
            store.update((s) => { s.workouts = s.workouts.filter((x) => x.id !== w.id); }, 'workout');
            toast(t('history.deleted'), 'success');
            drawList(); drawCal();
          }
        });
        listBox.append(h('div', { class: 'hist-item' },
          h('div', { class: 'date' }, h('b', {}, d.getDate()), h('span', {}, fmtDate(d, { month: 'short' }))),
          h('div', { class: 'info' },
            h('b', {}, w.program ? `${t('home.s4.' + w.program)} · ${names}` : names),
            h('span', {}, `${fmtDate(d, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · ${fmtTime(w.durationSec)} · ${w.totalReps} ${t('common.reps').toLowerCase()} · ${w.calories} kcal`)),
          sc !== null && sc !== undefined ? h('span', { class: `score-pill ${sc >= 80 ? 'ok' : sc >= 60 ? 'warn' : 'bad'}`, title: t('summary.score') }, `${sc}%`) : h('span', { class: 'score-pill' }, icon('user', 'sm')),
          h('a', { class: 'btn btn-ghost sm', href: `#/summary/${w.id}` }, t('history.details')),
          del));
      });
    }

    function drawCal() {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const days = computeStats().days;
      const lead = (first.getDay() + 6) % 7;
      const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const todayK = dayKey(now);
      let monthCount = 0;
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(h('div'));
      for (let d = 1; d <= count; d++) {
        const k = dayKey(new Date(first.getFullYear(), first.getMonth(), d));
        const n = days.get(k) || 0;
        monthCount += n;
        cells.push(h('div', { class: `d ${n ? 'has' : ''} ${k === todayK ? 'today' : ''}`, 'data-n': n || null, title: n ? t('history.count', { n }) : '' }, d));
      }
      calBox.innerHTML = '';
      calBox.append(
        h('div', { class: 'card-title' }, icon('calendar'), t('history.calendar')),
        h('div', { class: 'cal-head' },
          h('button', { class: 'icon-btn', 'aria-label': t('history.prevMonth'), onclick: () => { monthOffset--; drawCal(); } }, icon('chevronLeft', 'flip-rtl')),
          h('b', {}, fmtDate(first, { month: 'long', year: 'numeric' })),
          h('button', { class: 'icon-btn', 'aria-label': t('history.nextMonth'), disabled: monthOffset >= 0, onclick: () => { monthOffset++; drawCal(); } }, icon('chevronRight', 'flip-rtl'))),
        h('div', { class: 'cal' }, ...t('history.week').map((w) => h('div', { class: 'wd' }, w)), ...cells),
        h('p', { class: 'muted small', style: { marginTop: '12px' } }, t('history.count', { n: monthCount })));
    }
    drawList(); drawCal();
  },
};
