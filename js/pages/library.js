// =========================================================
// library.js — full exercise library with search & filters.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex } from '../core/i18n.js';
import { pageHead, emptyState, toggle } from '../core/ui.js';
import { EXERCISES, CATEGORIES } from '../data/exercises.js';
import { exerciseCard, isFav } from '../components/cards.js';
import { searchExercises } from '../components/nav.js';

const filters = { q: '', cat: 'all', diff: 'all', equip: 'all', fav: false }; // kept while the app is open

const libraryPage = {
  shot: 'library',
  render(root, params, query) {
    if (query.cat) filters.cat = query.cat;
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(t('library.title'), t('library.sub')));

    const search = h('input', { class: 'input', type: 'search', placeholder: t('library.search'), value: filters.q, 'aria-label': t('library.search') });
    const diffSel = h('select', { class: 'select', 'aria-label': t('library.difficulty') },
      h('option', { value: 'all' }, `${t('library.difficulty')}: ${t('common.all')}`),
      ...['beginner', 'intermediate', 'advanced'].map((d) => h('option', { value: d, selected: filters.diff === d }, t('diff.' + d))));
    const equipKeys = [...new Set(EXERCISES.flatMap((e) => e.equip))];
    const equipSel = h('select', { class: 'select', 'aria-label': t('library.equipment') },
      h('option', { value: 'all' }, `${t('library.equipment')}: ${t('common.all')}`),
      ...equipKeys.map((k) => h('option', { value: k, selected: filters.equip === k }, t('equip.' + k))));
    const favToggle = toggle(filters.fav, (v) => { filters.fav = v; draw(); }, t('library.favoritesOnly'));

    page.append(h('div', { class: 'toolbar glass' },
      h('div', { class: 'search-box' }, icon('search'), search),
      diffSel, equipSel,
      h('label', { class: 'row small' }, favToggle, t('library.favoritesOnly'))));

    const chipRow = h('div', { class: 'chip-row', role: 'group', 'aria-label': t('nav.categories') });
    ['all', ...CATEGORIES].forEach((c) => {
      const b = h('button', { class: 'chip', 'aria-pressed': String(filters.cat === c) }, c === 'all' ? t('common.all') : t('cats.' + c));
      b.addEventListener('click', () => { filters.cat = c; chipRow.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); });
      chipRow.append(b);
    });
    page.append(chipRow);

    const count = h('div', { class: 'result-count', 'aria-live': 'polite' });
    const grid = h('div', { class: 'ex-grid' });
    page.append(count, grid);

    function draw() {
      let list = filters.q.trim() ? searchExercises(filters.q) : EXERCISES.slice();
      if (filters.cat !== 'all') list = list.filter((e) => e.cats.includes(filters.cat));
      if (filters.diff !== 'all') list = list.filter((e) => e.diff === filters.diff);
      if (filters.equip !== 'all') list = list.filter((e) => e.equip.includes(filters.equip));
      if (filters.fav) list = list.filter((e) => isFav(e.id));
      list.sort((a, b) => ex(a.id).name.localeCompare(ex(b.id).name));
      count.textContent = t('library.results', { n: list.length });
      grid.innerHTML = '';
      if (!list.length) {
        grid.append(h('div', { class: 'glass', style: { gridColumn: '1 / -1' } },
          emptyState('search', t('library.noTitle'), t('library.noText'),
            h('button', { class: 'btn btn-ghost', onclick: () => { Object.assign(filters, { q: '', cat: 'all', diff: 'all', equip: 'all', fav: false }); root.innerHTML = ''; libraryPage.render(root, params, {}); } }, t('library.clear')))));
        return;
      }
      list.forEach((e, i) => grid.append(exerciseCard(e, i, () => filters.fav && draw())));
    }
    search.addEventListener('input', () => { filters.q = search.value; draw(); });
    diffSel.addEventListener('change', () => { filters.diff = diffSel.value; draw(); });
    equipSel.addEventListener('change', () => { filters.equip = equipSel.value; draw(); });
    draw();
    root.append(page);
  },
};
export default libraryPage;
