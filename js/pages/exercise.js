// =========================================================
// exercise.js — exercise detail page: demonstration, steps,
// breathing, mistakes, safety and "Start this exercise".
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex } from '../core/i18n.js';
import { emptyState } from '../core/ui.js';
import { byId, inCategory } from '../data/exercises.js';
import { demoPlayer } from '../components/demo.js';
import { favButton, exerciseCard } from '../components/cards.js';
import { analyzerKeys } from '../ai/analyzers.js';

export function fbText(key) {
  const v = t('fb.' + key);
  return v === 'fb.' + key ? t('workout.' + key) : v;
}

export default {
  shot: 'exercise',
  render(root, { id }) {
    const e = byId[id];
    const page = h('div', { class: 'page wide' });
    if (!e) {
      page.append(h('div', { class: 'glass' }, emptyState('search', t('exercise.notFound'), '', h('a', { class: 'btn btn-primary', href: '#/library' }, t('nav.library')))));
      root.append(page); return;
    }
    const tx = ex(e.id);
    const cat = e.cats[0];
    const player = demoPlayer(e);

    const section = (ic, title, body) => h('section', { class: 'section glass' }, h('h3', {}, icon(ic), title), body);
    const doseUnit = e.hold ? t('common.sec') : '';

    const left = h('div', { class: 'sticky' }, player.el,
      section('sparkles', t('exercise.ai'),
        h('ul', { class: 'bullets ai' }, ...analyzerKeys(e.ai).slice(0, 6).map((k) => h('li', {}, icon('scan', 'sm'), fbText(k))))));

    const right = h('div', {},
      h('nav', { class: 'breadcrumb' },
        h('a', { href: '#/library' }, t('nav.library')), icon('chevronRight', 'sm flip-rtl'),
        h('a', { href: `#/category/${cat}` }, t('cats.' + cat)), icon('chevronRight', 'sm flip-rtl'),
        h('span', {}, tx.name)),
      h('div', { class: 'row between', style: { alignItems: 'flex-start' } },
        h('h1', { class: 'display metal detail-title' }, tx.name),
        favButton(e.id)),
      h('div', { class: 'badges' },
        h('span', { class: `badge ${e.diff}` }, t('diff.' + e.diff)),
        ...e.equip.map((q) => h('span', { class: 'badge neutral' }, icon('dumbbell', 'sm'), t('equip.' + q))),
        h('span', { class: 'badge neutral' }, icon('camera', 'sm'), t('view.' + e.view))),
      h('div', { class: 'stack', style: { gap: '8px' } },
        h('span', { class: 'eyebrow' }, t('exercise.target')),
        h('div', { class: 'muscle-chips' }, ...tx.muscles.split(/[,،]/).map((m) => h('span', { class: 'chip' }, m.trim())))),
      h('div', { class: 'dose-tiles' },
        h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon('repeat', 'sm'), t('exercise.recReps')), h('div', { class: 'value' }, e.reps, h('small', {}, doseUnit + (e.perSide ? ' ' + t('common.perSide') : '')))),
        h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon('list', 'sm'), t('exercise.recSets')), h('div', { class: 'value' }, e.sets)),
        h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon('timer', 'sm'), t('exercise.rest')), h('div', { class: 'value' }, e.rest, h('small', {}, t('common.sec'))))),
      h('div', { class: 'cta-bar' },
        h('a', { class: 'btn btn-primary lg', href: `#/setup?ex=${e.id}` }, icon('play', 'sm'), t('exercise.start')),
        h('a', { class: 'btn btn-ghost lg', href: `#/category/${cat}` }, t('exercise.related', { cat: t('cats.' + cat) }))),
      section('target', t('exercise.startPos'), h('p', { class: 'muted' }, tx.start)),
      section('list', t('exercise.steps'), h('ol', { class: 'steps-list' }, ...tx.steps.map((s) => h('li', {}, h('span', {}, s))))),
      section('wind', t('exercise.breathing'), h('p', { class: 'muted' }, tx.breathing)),
      section('alert', t('exercise.mistakes'), h('ul', { class: 'bullets bad' }, ...tx.mistakes.map((m) => h('li', {}, icon('x', 'sm'), m)))),
      section('shield', t('exercise.safety'), h('ul', { class: 'bullets safe' }, ...tx.safety.map((m) => h('li', {}, icon('check', 'sm'), m)))));

    page.append(h('div', { class: 'detail' }, left, right));

    const related = inCategory(cat).filter((x) => x.id !== e.id).slice(0, 4);
    if (related.length) {
      page.append(h('h2', { class: 'display metal', style: { fontSize: '2rem', margin: '48px 0 16px' } }, t('exercise.related', { cat: t('cats.' + cat) })),
        h('div', { class: 'ex-grid' }, ...related.map((r, i) => exerciseCard(r, i))));
    }
    root.append(page);
    return () => player.destroy();
  },
};
