// =========================================================
// info.js — About, Help (FAQ) and Privacy Policy pages.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/i18n.js';
import { pageHead } from '../core/ui.js';

const list = (items, ic, cls = '') => h('ul', { class: `status-list ${cls}` }, ...items.map((x) => h('li', {}, icon(ic, 'sm'), h('span', {}, x))));

export const about = {
  shot: 'info',
  render(root) {
    const page = h('div', { class: 'page' });
    page.append(pageHead(t('about.title'), t('about.sub')),
      h('div', { class: 'glass card prose' }, h('p', {}, t('about.p1')),
        h('div', { class: 'card-title', style: { marginTop: '18px' } }, icon('settings'), t('about.stack')), list(t('about.stackList'), 'check')),
      h('h2', { class: 'display metal', style: { fontSize: '2rem', margin: '30px 0 14px' } }, t('about.status')),
      h('div', { class: 'grid c2' },
        h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('check'), t('about.done')), list(t('about.doneList'), 'check')),
        h('div', { class: 'glass card' }, h('div', { class: 'card-title' }, icon('lock'), t('about.creds')), list(t('about.credsList'), 'link'),
          h('div', { class: 'card-title', style: { marginTop: '18px' } }, icon('settings'), t('about.config')), list(t('about.configList'), 'info')),
        h('div', { class: 'glass card', style: { gridColumn: '1 / -1' } }, h('div', { class: 'card-title' }, icon('alert'), t('about.limits')), list(t('about.limitsList'), 'alert'))));
    root.append(page);
  },
};

export const help = {
  shot: 'info',
  render(root) {
    const page = h('div', { class: 'page' });
    page.append(pageHead(t('help.title'), t('help.sub')),
      h('div', { class: 'glass card faq' }, ...t('help.faq').map(([q, a], i) =>
        h('details', { open: i === 0 }, h('summary', {}, q, icon('chevronDown')), h('p', {}, a)))),
      h('p', { class: 'hint', style: { marginTop: '16px' } }, t('help.contact')),
      h('div', { class: 'cta-bar' }, h('a', { class: 'btn btn-primary', href: '#/setup' }, t('nav.startWorkout')), h('a', { class: 'btn btn-ghost', href: '#/settings' }, t('nav.settings'))));
    root.append(page);
  },
};

export const privacy = {
  shot: 'info',
  render(root) {
    const page = h('div', { class: 'page' });
    page.append(pageHead(t('privacy.title'), t('privacy.sub')),
      h('div', { class: 'stack', style: { gap: '14px' } }, ...t('privacy.sections').map(([title, text], i) =>
        h('section', { class: 'glass card prose' }, h('div', { class: 'card-title' }, icon(['camera', 'lock', 'link', 'settings', 'shield'][i] || 'info'), title), h('p', {}, text)))));
    root.append(page);
  },
};
