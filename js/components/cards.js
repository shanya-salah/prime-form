// =========================================================
// cards.js — the exercise card used in the library,
// category pages and favorites.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex } from '../core/i18n.js';
import { store } from '../core/store.js';
import { toast } from '../core/ui.js';
import { demoIcon } from './demo.js';

export function isFav(id) { return store.get().favorites.includes(id); }

export function favButton(id, onChange) {
  const btn = h('button', { class: 'heart-btn', 'aria-pressed': String(isFav(id)) }, icon('heart'));
  const label = () => btn.setAttribute('aria-label', isFav(id) ? t('exercise.removeFav') : t('exercise.addFav'));
  label();
  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    store.update((s) => {
      const i = s.favorites.indexOf(id);
      if (i >= 0) s.favorites.splice(i, 1); else s.favorites.push(id);
    }, 'favorites');
    btn.setAttribute('aria-pressed', String(isFav(id)));
    label();
    toast(isFav(id) ? t('exercise.addFav') : t('exercise.removeFav'), 'success', 1800);
    onChange && onChange();
  });
  return btn;
}

export function exerciseCard(e, i = 0, onFavChange) {
  const tx = ex(e.id);
  return h('article', { class: 'ex-card glass', style: { '--i': i } },
    h('a', { class: 'cover', href: `#/exercise/${e.id}`, 'aria-label': tx.name }),
    favButton(e.id, onFavChange),
    h('div', { class: 'art' },
      demoIcon(e.demo, 1, 140),
      h('span', { class: 'badge neutral view-tag' }, icon('camera', 'sm'), t('view.' + e.view))),
    h('div', { class: 'body' },
      h('h3', {}, tx.name),
      h('p', { class: 'muscles' }, tx.muscles),
      h('div', { class: 'meta' },
        h('span', { class: `badge ${e.diff}` }, t('diff.' + e.diff)),
        h('span', { class: 'badge neutral' }, t('equip.' + e.equip[0])),
        h('span', { class: 'dose' }, `${e.sets} × ${e.reps}${e.hold ? t('common.sec') : ''}`))));
}
