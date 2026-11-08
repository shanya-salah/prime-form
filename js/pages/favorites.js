// =========================================================
// favorites.js — exercises you marked with the heart.
// =========================================================
import { h } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { store } from '../core/store.js';
import { pageHead, emptyState } from '../core/ui.js';
import { byId } from '../data/exercises.js';
import { exerciseCard } from '../components/cards.js';

export default {
  shot: 'library',
  render(root) {
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(t('nav.favorites'), t('library.sub')));
    const grid = h('div', { class: 'ex-grid' });
    const draw = () => {
      const favs = store.get().favorites.map((id) => byId[id]).filter(Boolean);
      grid.innerHTML = '';
      if (!favs.length) {
        grid.append(h('div', { class: 'glass', style: { gridColumn: '1 / -1' } },
          emptyState('heart', t('library.noTitle'), t('exercise.addFav'), h('a', { class: 'btn btn-primary', href: '#/library' }, t('nav.library')))));
        return;
      }
      favs.forEach((e, i) => grid.append(exerciseCard(e, i, draw)));
    };
    draw();
    page.append(grid);
    root.append(page);
  },
};
