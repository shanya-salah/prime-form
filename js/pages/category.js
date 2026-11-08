// =========================================================
// category.js — exercises of one muscle group.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/i18n.js';
import { pageHead } from '../core/ui.js';
import { CATEGORIES, CAT_ICON, inCategory } from '../data/exercises.js';
import { exerciseCard } from '../components/cards.js';
import { demoIcon } from '../components/demo.js';

export default {
  shot: 'category',
  render(root, { id }) {
    const cat = CATEGORIES.includes(id) ? id : 'fullbody';
    const list = inCategory(cat);
    const page = h('div', { class: 'page wide' });
    page.append(
      h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
        h('a', { href: '#/' }, t('nav.home')), icon('chevronRight', 'sm flip-rtl'),
        h('a', { href: '#/library' }, t('nav.library')), icon('chevronRight', 'sm flip-rtl'),
        h('span', {}, t('cats.' + cat))),
      pageHead(t('cats.' + cat), `${t('mega.count', { n: list.length })} · ${t('library.catSub')}`,
        h('div', { class: 'glass', style: { width: '96px', height: '96px', borderRadius: '24px', display: 'grid', placeItems: 'center' } }, demoIcon(CAT_ICON[cat][0], CAT_ICON[cat][1], 80))));

    const grid = h('div', { class: 'ex-grid' }, ...list.map((e, i) => exerciseCard(e, i)));
    page.append(grid);

    // other categories
    page.append(h('h2', { class: 'eyebrow', style: { margin: '40px 0 12px' } }, t('mega.title')),
      h('div', { class: 'chip-row' }, ...CATEGORIES.filter((c) => c !== cat).map((c) => h('a', { class: 'chip', href: `#/category/${c}` }, t('cats.' + c)))));
    root.append(page);
  },
};
