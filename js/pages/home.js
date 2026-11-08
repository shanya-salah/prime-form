// =========================================================
// home.js — the full-screen slide experience from the video.
// Scroll / swipe / arrow keys / dots move between 6 slides,
// and each slide flies the 3D camera to a new spot.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex, fmtNum } from '../core/i18n.js';
import { store } from '../core/store.js';
import { setShot } from '../scene/gym3d.js';
import { showPhoto } from '../scene/photos.js';
import { ring } from '../core/ui.js';
import { demoIcon } from '../components/demo.js';
import { computeStats, recommend } from '../services/stats.js';
import { EXERCISES } from '../data/exercises.js';
import { PROGRAMS } from '../data/programs.js';

const SHOT_ORDER = ['hero', 'neon', 'zone', 'programs', 'overhead', 'orbit'];
let lastIndex = 0; // remember the slide when coming back

export default {
  shot: null, // the page manages its own camera
  render(root) {
    document.body.classList.add('page-home');
    const st = store.get();
    const stats = computeStats(st.workouts);
    const motivation = t('motivation');
    const quote = motivation[new Date().getDate() % motivation.length];
    const s = (n, ...kids) => h('section', { class: `slide ${n.cls || ''}`, 'aria-roledescription': 'slide', 'aria-label': `${t('home.slide')} ${n.i + 1}` }, ...kids);
    const A = (d, el) => { el.classList.add('s-anim'); el.style.setProperty('--d', d); return el; };

    // ---------- Slide 1: hero ----------
    const s1 = s({ i: 0 },
      h('div', {},
        A(0, h('div', { class: 'eyebrow' }, t('home.s1.eyebrow'))),
        A(1, h('h1', { class: 'display metal hero-title', style: { marginTop: '14px' } },
          t('home.s1.t1'), h('br'), t('home.s1.t2'), h('br'), h('span', { class: 'accent-word' }, t('home.s1.t3')))),
        A(2, h('p', { class: 'hero-lead' }, t('home.s1.lead'))),
        A(3, h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-primary lg', href: '#/setup' }, icon('play', 'sm'), t('nav.startWorkout')),
          h('a', { class: 'btn btn-ghost lg', href: '#/library' }, t('home.s1.explore'), icon('arrowRight', 'sm flip-rtl')))),
        A(4, h('div', { class: 'hero-stats' },
          h('div', {}, h('b', {}, EXERCISES.length), h('span', {}, t('home.s1.statEx'))),
          h('div', {}, h('b', {}, '3'), h('span', {}, t('home.s1.statLang'))),
          h('div', {}, h('b', {}, '100%'), h('span', {}, t('home.s1.statPrivate')))))),
      A(3, h('div', { class: 'hero-side' }, t('home.s1.side'), h('small', {}, t('home.s1.sideSub'))))
    );

    // ---------- Slide 2: neon motivation ----------
    const s2 = s({ i: 1 },
      h('div', { class: 'neon-quote' },
        A(0, h('div', { class: 'eyebrow' }, t('home.s2.eyebrow'))),
        A(1, h('h2', { class: 'display metal quote-title', style: { marginTop: '14px' } }, `“${quote}”`)),
        A(2, h('p', { class: 'q muted' }, t('home.s2.title'))),
        A(3, h('div', { class: 'hero-actions' }, h('a', { class: 'btn btn-primary', href: '#/setup' }, t('nav.startWorkout'))))));

    // ---------- Slide 3: performance zone (how the AI works) ----------
    const steps = [1, 2, 3, 4].map((n) => h('li', {}, h('span', { class: 'n' }, '0' + n),
      h('div', {}, h('b', {}, t(`home.s3.st${n}`)), h('span', {}, t(`home.s3.st${n}t`)))));
    const s3 = s({ i: 2 },
      A(0, h('div', { class: 'zone-card glass scan-frame' },
        h('div', { class: 'eyebrow' }, t('home.s3.eyebrow')),
        h('h2', { class: 'display metal', style: { marginTop: '10px' } }, t('home.s3.title')),
        h('p', { class: 'muted small' }, t('home.s3.lead')),
        h('ol', { class: 'zone-steps' }, ...steps),
        h('div', { class: 'hero-actions', style: { marginTop: 0 } },
          h('a', { class: 'btn btn-primary', href: '#/setup' }, t('nav.startWorkout')),
          h('a', { class: 'btn btn-ghost', href: '#/help' }, t('nav.help'))))));

    // ---------- Slide 4: programs (Core / Pro / Elite) ----------
    const level = st.profile.level;
    const prog = (key) => {
      const p = PROGRAMS[key];
      const featured = p.level === level;
      return h('div', { class: `program glass ${featured ? 'featured' : ''}` },
        featured ? h('span', { class: 'badge beginner', style: { marginBottom: '8px' } }, icon('sparkles', 'sm'), t('home.s4.recommended')) : null,
        h('h3', { class: 'display' }, t(`home.s4.${key}`)),
        h('div', { class: 'tagline' }, t(`home.s4.${key}Tag`)),
        h('div', { class: 'fig' }, demoIcon(p.demo, 1, 130)),
        h('ul', {}, ...t(`home.s4.${key}B`).map((b) => h('li', {}, icon('check'), b))),
        h('a', { class: `btn ${featured ? 'btn-primary' : 'btn-ghost'} block sm`, href: `#/setup?program=${key}` }, t('home.s4.start')));
    };
    const s4 = s({ i: 3, cls: 'center' },
      h('div', { style: { width: '100%' } },
        A(0, h('div', { class: 'eyebrow' }, t('home.s4.eyebrow'))),
        A(1, h('h2', { class: 'display metal', style: { fontSize: 'clamp(2.2rem,5vw,4rem)', margin: '10px 0 26px' } }, t('home.s4.title'))),
        A(2, h('div', { class: 'programs' }, prog('core'), prog('pro'), prog('elite')))));

    // ---------- Slide 5: dashboard ----------
    const goal = st.profile.dailyRepsGoal || 100;
    const tile = (ic, label, value, unit = '') => h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon(ic, 'sm'), label), h('div', { class: 'value' }, value, unit ? h('small', {}, unit) : null));
    const s5 = s({ i: 4, cls: 'center' },
      h('div', { style: { width: '100%' } },
        A(0, h('div', { class: 'eyebrow' }, t('home.s5.eyebrow'))),
        A(1, h('h2', { class: 'display metal', style: { fontSize: 'clamp(2.4rem,6vw,5rem)', margin: '10px 0 26px' } }, t('home.s5.title'))),
        A(2, h('div', { class: 'dash' },
          h('div', { class: 'glass goal-card' },
            h('div', { class: 'eyebrow' }, t('home.s5.goal')),
            ring(stats.repsToday / goal, 170, 13, [h('b', {}, fmtNum(stats.repsToday)), h('span', {}, t('home.s5.ofGoal', { n: goal }))]),
            h('a', { class: 'btn btn-ghost sm', href: '#/progress' }, t('home.s5.open'))),
          h('div', { class: 'dash-tiles' },
            tile('activity', t('home.s5.repsToday'), fmtNum(stats.repsToday)),
            tile('clock', t('home.s5.minutesToday'), fmtNum(stats.minutesToday), t('common.min')),
            tile('calendar', t('home.s5.weekWorkouts'), stats.weekCount),
            tile('flame', t('home.s5.streak'), stats.streak),
            tile('trophy', t('home.s5.totalWorkouts'), stats.totalWorkouts),
            tile('target', t('summary.score'), stats.avgScore === null ? '—' : stats.avgScore, stats.avgScore === null ? '' : '%'))))));

    // ---------- Slide 6: recommended + thumbnails ----------
    const rec = recommend(6);
    const s6 = s({ i: 5, cls: 'center' },
      h('div', { style: { marginTop: '-8vh' } },
        A(0, h('div', { class: 'eyebrow' }, t('home.s6.eyebrow'))),
        A(1, h('h2', { class: 'display metal', style: { fontSize: 'clamp(2rem,5vw,4.2rem)', marginTop: '12px' } }, t('home.s6.t1'), h('br'), t('home.s6.t2'))),
        A(2, h('p', { class: 'hero-lead' }, t('home.s6.lead'))),
        A(3, h('div', { class: 'hero-actions' }, h('a', { class: 'btn btn-primary', href: '#/setup' }, t('nav.startWorkout')), h('a', { class: 'btn btn-ghost', href: '#/library' }, t('nav.library'))))),
      A(4, h('div', { class: 'thumb-strip' },
        ...rec.map((e) => h('a', { class: 'thumb glass', href: `#/exercise/${e.id}` },
          h('div', { class: 'fig' }, demoIcon(e.demo, 1, 64)),
          h('div', {}, h('b', {}, ex(e.id).name), h('span', {}, `${t('diff.' + e.diff)} · ${e.sets}×${e.reps}${e.hold ? t('common.sec') : ''}`)))))));

    const slides = [s1, s2, s3, s4, s5, s6];
    const dots = h('div', { class: 'dots', role: 'tablist' });
    const counter = h('div', { class: 'slide-count' });
    const prev = h('button', { class: 'arrow prev', 'aria-label': t('common.back') }, icon('chevronLeft', 'flip-rtl'));
    const next = h('button', { class: 'arrow next', 'aria-label': t('common.next') }, icon('chevronRight', 'flip-rtl'));
    slides.forEach((_, i) => dots.append(h('button', { role: 'tab', 'aria-label': `${t('home.slide')} ${i + 1}`, onclick: () => go(i) })));

    const home = h('div', { class: 'home' }, h('div', { class: 'slides' }, ...slides), prev, next, dots, counter,
      h('div', { class: 'scroll-hint' }, h('i'), t('home.scroll')));
    root.append(home);

    let index = -1, lock = 0;
    function go(i, instant = false) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (i === index) return;
      slides.forEach((sl, k) => {
        sl.classList.toggle('leaving', k === index);
        if (k !== i) sl.classList.remove('active');
      });
      setTimeout(() => slides.forEach((sl, k) => k !== i && sl.classList.remove('leaving')), 450);
      slides[i].classList.add('active');
      [...dots.children].forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      counter.innerHTML = `<b>0${i + 1}</b> / 0${slides.length}`;
      prev.disabled = i === 0; next.disabled = i === slides.length - 1;
      setShot(SHOT_ORDER[i], { instant });
      showPhoto(i);
      index = i; lastIndex = i;
    }

    const step = (d) => { const now = Date.now(); if (now - lock < 1100) return; lock = now; go(index + d); };
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    const onWheel = (e) => {
      // let inner scroll areas (e.g. on small phones) scroll normally
      if (e.target.closest('.thumb-strip, .programs') && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaY) < 12) return;
      e.preventDefault();
      step(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e) => {
      if (document.querySelector('.modal-wrap') || /input|select|textarea/i.test(document.activeElement.tagName)) return;
      const rtl = document.dir === 'rtl';
      if (['ArrowDown', 'PageDown', ' '].includes(e.key) || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { e.preventDefault(); step(1); }
      if (['ArrowUp', 'PageUp'].includes(e.key) || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); step(-1); }
    };
    let touch = null;
    const onTouchStart = (e) => { touch = [e.touches[0].clientX, e.touches[0].clientY]; };
    const onTouchEnd = (e) => {
      if (!touch) return;
      const dx = e.changedTouches[0].clientX - touch[0], dy = e.changedTouches[0].clientY - touch[1];
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && !e.target.closest('.thumb-strip, .programs')) {
        const rtl = document.dir === 'rtl';
        step((dx < 0) !== rtl ? 1 : -1);
      }
      touch = null;
    };
    home.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    home.addEventListener('touchstart', onTouchStart, { passive: true });
    home.addEventListener('touchend', onTouchEnd);

    go(lastIndex, false);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('page-home');
    };
  },
};
