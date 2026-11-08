// =========================================================
// nav.js — header, "Exercise Categories" mega menu,
// language selector, hamburger drawer and exercise search.
// =========================================================
import { h, $, $$ } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex, LANGS, lang } from '../core/i18n.js';
import { store } from '../core/store.js';
import { navigate, currentPath } from '../core/router.js';
import { CATEGORIES, CAT_ICON, inCategory, EXERCISES } from '../data/exercises.js';
import { demoIcon } from './demo.js';
import { openModal } from '../core/ui.js';

let mega, drawer, backdrop, langPop, megaBtn;

export function renderNav() {
  const header = document.getElementById('site-header');
  header.innerHTML = '';

  // ---- Language selector ----
  const langBtn = h('button', { class: 'icon-btn lang-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': t('nav.language') },
    icon('globe', 'sm'), h('span', {}, lang().short), icon('chevronDown', 'sm'));
  langPop = h('div', { class: 'menu-pop', role: 'menu' },
    ...Object.values(LANGS).map((L) =>
      h('button', { role: 'menuitemradio', 'aria-checked': String(L.code === lang().code), lang: L.code, dir: L.dir,
        onclick: () => { closeAll(); setLanguage(L.code); } },
        h('span', {}, L.label), L.code === lang().code ? icon('check', 'sm') : null)));
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); const open = !langPop.classList.contains('open'); closeAll(); langPop.classList.toggle('open', open); langBtn.setAttribute('aria-expanded', String(open)); });

  // ---- Mega menu button ----
  megaBtn = h('button', { class: 'nav-link', 'aria-expanded': 'false', 'aria-controls': 'mega-menu' }, t('nav.categories'), icon('chevronDown', 'chev'));
  megaBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMega(); });

  const link = (href, label, cls = '') => h('a', { class: `nav-link ${cls}`, href: '#' + href, dataset: { path: href } }, label);

  header.append(
    h('nav', { class: 'nav', 'aria-label': 'Main' },
      h('a', { class: 'brand', href: '#/', 'aria-label': t('brand.name') },
        h('span', { class: 'brand-mark' }, h('span', {}, 'PRIME'), h('span', {}, 'FORM')),
        h('span', { class: 'brand-tag' }, t('brand.tag'))),
      h('div', { class: 'nav-links' },
        link('/', t('nav.home')),
        megaBtn,
        link('/setup', t('nav.workout')),
        link('/progress', t('nav.progressShort')),
        link('/music', t('nav.music'), 'opt'),
        link('/history', t('nav.history'), 'opt')),
      h('div', { class: 'nav-end' },
        h('div', { class: 'lang' }, langBtn, langPop),
        h('button', { class: 'icon-btn', 'aria-label': t('nav.search'), onclick: openSearch }, icon('search')),
        h('a', { class: 'nav-link hide-sm', href: '#/profile', dataset: { path: '/profile' } }, icon('user', 'sm'), store.get().profile.name || t('nav.profile')),
        h('a', { class: 'btn btn-primary sm hide-sm', href: '#/setup' }, t('nav.startWorkout')),
        h('button', { class: 'icon-btn burger', 'aria-label': t('nav.menu'), 'aria-expanded': 'false', 'aria-controls': 'drawer', onclick: openDrawer },
          h('span'), h('span'), h('span'))))
  );

  // ---- Mega menu panel ----
  mega?.remove();
  mega = h('div', { class: 'mega', id: 'mega-menu', role: 'region', 'aria-label': t('mega.title') },
    h('div', { class: 'mega-head' },
      h('div', {}, h('div', { class: 'eyebrow' }, t('nav.categories')), h('h3', { class: 'display' }, t('mega.title')), h('p', { class: 'muted small' }, t('mega.sub'))),
      h('a', { class: 'btn btn-ghost sm', href: '#/library', onclick: closeAll }, t('mega.all'), icon('arrowRight', 'sm flip-rtl'))),
    h('div', { class: 'mega-grid' },
      ...CATEGORIES.map((c, i) => {
        const [demoKey, frame] = CAT_ICON[c];
        return h('a', { class: 'cat-tile', href: `#/category/${c}`, style: { '--i': i }, onclick: closeAll },
          demoIcon(demoKey, frame),
          h('div', {}, h('b', {}, t('cats.' + c)), h('span', {}, t('mega.count', { n: inCategory(c).length }))));
      })));
  mega.addEventListener('click', (e) => e.stopPropagation());
  document.body.append(mega);

  // ---- Drawer (hamburger) ----
  const root = document.getElementById('drawer-root');
  root.innerHTML = '';
  backdrop = h('div', { class: 'backdrop', onclick: closeAll });
  const items = [
    ['/', 'home', 'nav.dashboard'], ['/library', 'list', 'nav.library'], ['/history', 'history', 'nav.history'],
    ['/progress', 'chart', 'nav.progress'], ['/profile', 'user', 'nav.profile'], ['/settings', 'settings', 'nav.settings'],
    ['/music', 'music', 'nav.music'], ['/favorites', 'heart', 'nav.favorites'], ['/about', 'info', 'nav.about'],
    ['/help', 'help', 'nav.help'], ['/privacy', 'shield', 'nav.privacy'],
  ];
  drawer = h('aside', { class: 'drawer', id: 'drawer', 'aria-label': t('nav.menu'), 'aria-hidden': 'true' },
    h('div', { class: 'drawer-head' },
      h('span', { class: 'brand-mark' }, h('span', {}, 'PRIME'), h('span', {}, 'FORM')),
      h('button', { class: 'icon-btn', 'aria-label': t('nav.close'), onclick: closeAll }, icon('x'))),
    h('button', { class: 'btn btn-ghost block', style: { marginBottom: '8px' }, onclick: () => { closeAll(); setTimeout(toggleMega, 50); } }, icon('dumbbell', 'sm'), t('nav.categories')),
    ...items.map(([href, ic, key], i) => h('a', { href: '#' + href, style: { '--i': i }, dataset: { path: href }, onclick: closeAll }, icon(ic), t(key))),
    h('div', { class: 'drawer-foot' }, h('a', { class: 'btn btn-primary block', href: '#/setup', onclick: closeAll, style: { opacity: 1, transform: 'none' } }, icon('play', 'sm'), t('nav.startWorkout'))));
  root.append(backdrop, drawer);

  markActive();
}

export function markActive() {
  const path = currentPath();
  $$('[data-path]').forEach((a) => {
    const p = a.dataset.path;
    a.classList.toggle('active', p === '/' ? path === '/' : path.startsWith(p));
  });
  megaBtn?.classList.toggle('active', path.startsWith('/category') || path.startsWith('/exercise') || path.startsWith('/library'));
}

function toggleMega() {
  const open = !mega.classList.contains('open');
  closeAll();
  mega.classList.toggle('open', open);
  megaBtn.setAttribute('aria-expanded', String(open));
}

function openDrawer() {
  closeAll();
  drawer.classList.add('open'); backdrop.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  $('.burger')?.setAttribute('aria-expanded', 'true');
  setTimeout(() => drawer.querySelector('a, button')?.focus(), 80);
}

export function closeAll() {
  mega?.classList.remove('open'); megaBtn?.setAttribute('aria-expanded', 'false');
  drawer?.classList.remove('open'); backdrop?.classList.remove('open'); drawer?.setAttribute('aria-hidden', 'true');
  $('.burger')?.setAttribute('aria-expanded', 'false');
  langPop?.classList.remove('open');
}

document.addEventListener('click', () => { mega?.classList.remove('open'); megaBtn?.setAttribute('aria-expanded', 'false'); langPop?.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });

export function setLanguage(code) {
  store.update((s) => { s.settings.lang = code; }, 'lang');
}

// ---- Search overlay ----
function normalize(s) { return String(s).toLowerCase().normalize('NFKD').replace(/[ً-ٟ]/g, ''); }

export function searchExercises(q) {
  const n = normalize(q.trim());
  if (!n) return [];
  return EXERCISES.filter((e) => {
    const tx = ex(e.id);
    const hay = [tx.name, tx.muscles, ...e.cats.map((c) => t('cats.' + c)), e.id].map(normalize).join(' ');
    return n.split(/\s+/).every((w) => hay.includes(w));
  });
}

function openSearch() {
  closeAll();
  const input = h('input', { class: 'input', type: 'search', placeholder: t('search.ph'), 'aria-label': t('nav.search'), autofocus: true });
  const list = h('div', { class: 'search-results' });
  const draw = () => {
    const res = searchExercises(input.value).slice(0, 8);
    list.innerHTML = '';
    if (input.value && !res.length) list.append(h('p', { class: 'muted small', style: { padding: '14px 4px' } }, t('search.none')));
    res.forEach((e) => list.append(h('a', { class: 'search-item', href: `#/exercise/${e.id}`, onclick: () => m.close() },
      demoIcon(e.demo, 1, 40), h('div', {}, h('b', {}, ex(e.id).name), h('span', {}, e.cats.map((c) => t('cats.' + c)).join(' · '))))));
  };
  input.addEventListener('input', draw);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = list.querySelector('a'); if (first) { m.close(); navigate(first.getAttribute('href').slice(1)); } }
  });
  const m = openModal(h('div', { class: 'stack' }, h('div', { class: 'row' }, icon('search'), h('div', { class: 'grow' }, input)), list, h('p', { class: 'hint' }, t('search.hint'))));
  m.box.classList.add('search-modal');
}
