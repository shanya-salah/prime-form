// =========================================================
// onboarding.js — 3-step welcome on the first visit:
// language → about you → goal & level.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, LANGS, lang } from '../core/i18n.js';
import { store, fromDisplayWeight, unitLabel } from '../core/store.js';
import { openModal, segmented } from '../core/ui.js';

export function maybeShowOnboarding() { if (!store.get().onboarded) show(0); }
export function replayOnboarding() { show(0); }

function show(step) {
  const p = store.get().profile;
  const total = 3;
  const dots = h('div', { class: 'onb-steps' }, ...Array.from({ length: total }, (_, i) => h('i', { class: i <= step ? 'on' : '' })));
  const head = (title, sub) => [dots, h('div', { class: 'eyebrow' }, t('onboarding.step', { a: step + 1, b: total })), h('h2', { class: 'display metal', style: { fontSize: '2rem', margin: '8px 0' } }, title), sub ? h('p', { class: 'muted small', style: { marginBottom: '18px' } }, sub) : null];
  let m;
  const finish = () => { store.update((s) => (s.onboarded = true), 'onboarded'); m.close(); };
  const next = () => { m.close(); show(step + 1); };
  const skip = h('button', { class: 'btn btn-text', onclick: finish }, t('onboarding.skip'));

  let body;
  if (step === 0) {
    body = h('div', {}, ...head(t('onboarding.welcome'), t('onboarding.welcomeSub')),
      h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, t('onboarding.lang')),
      h('div', { class: 'onb-lang' }, ...Object.values(LANGS).map((L) =>
        h('button', { lang: L.code, dir: L.dir, 'aria-pressed': String(L.code === lang().code),
          onclick: () => { store.update((s) => (s.settings.lang = L.code), 'lang'); m.close(); show(0); } }, L.label, L.code === lang().code ? icon('check') : null))),
      h('div', { class: 'modal-actions' }, skip, h('button', { class: 'btn btn-primary', onclick: next }, t('common.next'), icon('arrowRight', 'sm flip-rtl'))));
  } else if (step === 1) {
    const name = h('input', { class: 'input', id: 'o-name', value: p.name || '', maxlength: 40, placeholder: t('setup.namePh'), autofocus: true });
    const weight = h('input', { class: 'input', id: 'o-w', type: 'number', min: 1, step: 0.1, value: p.weightKg ?? '' });
    let units = store.get().settings.units;
    const err = h('div', { class: 'error-text' });
    body = h('div', {}, ...head(t('onboarding.about'), t('onboarding.aboutSub')),
      h('div', { class: 'stack' },
        h('div', { class: 'field' }, h('label', { for: 'o-name' }, t('profile.name')), name),
        h('div', { class: 'field' }, h('label', { for: 'o-w' }, t('profile.weight')), h('div', { class: 'row' }, h('div', { class: 'grow' }, weight),
          segmented([['kg', 'kg'], ['lb', 'lb']], units, (v) => (units = v), t('settings.units')))), err),
      h('div', { class: 'modal-actions' }, skip, h('button', { class: 'btn btn-primary', onclick: () => {
        store.update((s) => (s.settings.units = units), 'settings');
        const kg = weight.value === '' ? null : fromDisplayWeight(weight.value);
        if (kg !== null && !(kg >= 20 && kg <= 350)) { err.textContent = t('setup.errors.weight'); return; }
        store.update((s) => {
          s.profile.name = name.value.trim().slice(0, 40);
          if (kg !== null) { s.profile.weightKg = Math.round(kg * 10) / 10; s.weights.push({ date: new Date().toISOString(), kg: s.profile.weightKg }); }
        }, 'profile');
        next();
      } }, t('common.next'), icon('arrowRight', 'sm flip-rtl'))));
  } else {
    let goal = p.goal, level = p.level;
    body = h('div', {}, ...head(t('onboarding.goal'), null),
      h('div', { class: 'field' }, h('span', { class: 'label' }, t('profile.goal')), segmented(Object.entries(t('profile.goals')), goal, (v) => (goal = v))),
      h('div', { class: 'field', style: { marginTop: '14px' } }, h('span', { class: 'label' }, t('profile.level')), segmented(['beginner', 'intermediate', 'advanced'].map((l) => [l, t('diff.' + l)]), level, (v) => (level = v))),
      h('p', { class: 'hint', style: { marginTop: '16px' } }, t('setup.privacy')),
      h('div', { class: 'modal-actions' }, h('button', { class: 'btn btn-primary', onclick: () => {
        store.update((s) => { s.profile.goal = goal; s.profile.level = level; s.settings.difficulty = level; }, 'profile');
        finish();
        location.hash = '#/';
      } }, icon('play', 'sm'), t('onboarding.finish'))));
  }
  m = openModal(body, { dismissable: false });
}
