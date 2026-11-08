// =========================================================
// profile.js — name, body measurements, goal, level, daily goals.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, fmtDate } from '../core/i18n.js';
import { store, toDisplayWeight, fromDisplayWeight, unitLabel } from '../core/store.js';
import { pageHead, toast, segmented, notice } from '../core/ui.js';

export default {
  shot: 'settings',
  render(root) {
    const p = store.get().profile;
    const page = h('div', { class: 'page' });
    page.append(pageHead(t('profile.title'), t('profile.sub')));

    const draft = { ...p };
    const err = {};
    const field = (label, input, key) => { err[key] = h('div', { class: 'error-text' }); return h('div', { class: 'field' }, h('label', { for: input.id }, label), input, err[key]); };
    const name = h('input', { class: 'input', id: 'p-name', maxlength: 40, value: p.name || '' });
    const weight = h('input', { class: 'input', id: 'p-w', type: 'number', step: 0.1, min: 1, value: toDisplayWeight(p.weightKg) });
    const height = h('input', { class: 'input', id: 'p-h', type: 'number', step: 1, min: 50, value: p.heightCm ?? '' });
    const reps = h('input', { class: 'input', id: 'p-r', type: 'number', step: 5, min: 5, value: p.dailyRepsGoal });
    const mins = h('input', { class: 'input', id: 'p-m', type: 'number', step: 5, min: 5, value: p.dailyMinutesGoal });

    const first = store.get().workouts.map((w) => w.date).sort()[0];
    const initials = (p.name || 'PF').split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
    const bmiBox = h('div');
    const drawBmi = () => {
      const kg = fromDisplayWeight(weight.value), cm = Number(height.value);
      bmiBox.innerHTML = '';
      if (kg > 0 && cm > 50) {
        const bmi = kg / ((cm / 100) ** 2);
        bmiBox.append(h('div', { class: 'glass stat' }, h('div', { class: 'label' }, icon('activity', 'sm'), t('profile.bmi')), h('div', { class: 'value' }, bmi.toFixed(1)), h('div', { class: 'hint' }, t('profile.bmiNote'))));
      }
    };
    weight.addEventListener('input', drawBmi); height.addEventListener('input', drawBmi);

    const goalSeg = segmented(Object.entries(t('profile.goals')), p.goal, (v) => (draft.goal = v), t('profile.goal'));
    const levelSeg = segmented(['beginner', 'intermediate', 'advanced'].map((l) => [l, t('diff.' + l)]), p.level, (v) => (draft.level = v), t('profile.level'));

    const save = h('button', { class: 'btn btn-primary', type: 'submit' }, icon('check', 'sm'), t('common.save'));
    const form = h('form', { class: 'glass card', novalidate: true },
      h('div', { class: 'row', style: { gap: '16px', marginBottom: '20px' } },
        h('div', { style: { width: '72px', height: '72px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'Anton, var(--font-display)', fontSize: '1.8rem' } }, initials),
        h('div', {}, h('b', { style: { fontSize: '1.2rem' } }, p.name || t('nav.profile')), first ? h('div', { class: 'muted small' }, t('profile.member', { date: fmtDate(first) })) : null)),
      h('div', { class: 'form-grid' },
        field(t('profile.name'), name, 'name'),
        field(`${t('profile.weight')} (${unitLabel()})`, weight, 'weight'),
        field(t('profile.height'), height, 'height'),
        h('div', {}, bmiBox),
        h('div', { class: 'field full' }, h('span', { class: 'label' }, t('profile.goal')), goalSeg),
        h('div', { class: 'field full' }, h('span', { class: 'label' }, t('profile.level')), levelSeg),
        field(t('profile.dailyReps'), reps, 'reps'),
        field(`${t('profile.dailyMinutes')}`, mins, 'mins')),
      h('div', { style: { marginTop: '20px' } }, save));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      Object.values(err).forEach((x) => (x.textContent = ''));
      let ok = true;
      const kg = weight.value === '' ? null : fromDisplayWeight(weight.value);
      if (name.value.trim().length > 40) { err.name.textContent = t('setup.errors.name'); ok = false; }
      if (kg !== null && !(kg >= 20 && kg <= 350)) { err.weight.textContent = t('setup.errors.weight'); ok = false; }
      if (height.value !== '' && !(+height.value >= 80 && +height.value <= 250)) { err.height.textContent = '80–250 cm'; ok = false; }
      if (!(+reps.value >= 5 && +reps.value <= 5000)) { err.reps.textContent = '5–5000'; ok = false; }
      if (!(+mins.value >= 5 && +mins.value <= 600)) { err.mins.textContent = '5–600'; ok = false; }
      if (!ok) return toast(t('setup.errors.fix'), 'error');
      store.update((s) => {
        if (kg !== null && Math.round(kg * 10) / 10 !== s.profile.weightKg) s.weights.push({ date: new Date().toISOString(), kg: Math.round(kg * 10) / 10 });
        Object.assign(s.profile, {
          name: name.value.trim(), weightKg: kg === null ? null : Math.round(kg * 10) / 10, heightCm: height.value === '' ? null : +height.value,
          goal: draft.goal, level: draft.level, dailyRepsGoal: +reps.value, dailyMinutesGoal: +mins.value,
        });
      }, 'profile');
      toast(t('profile.saved'), 'success');
    });

    drawBmi();
    page.append(form, h('div', { style: { marginTop: '16px' } }, notice(t('settings.dataInfo'), '', 'lock')));
    root.append(page);
  },
};
