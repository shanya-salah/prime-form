// =========================================================
// setup.js — "Workout setup" form with validation.
// Opens with ?ex=<exercise id> or ?program=core|pro|elite
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex } from '../core/i18n.js';
import { store, toDisplayWeight, fromDisplayWeight, unitLabel } from '../core/store.js';
import { navigate } from '../core/router.js';
import { pageHead, toggle, toast, notice } from '../core/ui.js';
import { EXERCISES, CATEGORIES, byId } from '../data/exercises.js';
import { PROGRAMS } from '../data/programs.js';
import { demoIcon } from '../components/demo.js';
import { setPlan } from '../services/session.js';

export default {
  shot: 'setup',
  render(root, params, query) {
    const st = store.get();
    const program = PROGRAMS[query.program] ? query.program : null;
    let exId = byId[query.ex] ? query.ex : null;
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(program ? `${t('home.s4.' + program)} — ${t('setup.title')}` : t('setup.title'), t('setup.sub')));

    // ---------- fields ----------
    const field = (label, control, id, hint) => {
      const err = h('div', { class: 'error-text', id: id + '-err', 'aria-live': 'polite' });
      const wrap = h('div', { class: 'field' }, h('label', { for: id }, label), control, hint ? h('div', { class: 'hint' }, hint) : null, err);
      return { wrap, err };
    };
    const num = (id, value, { min = 0, step = 1, suffix = '' } = {}) => {
      const input = h('input', { class: 'input', id, type: 'number', inputmode: step < 1 ? 'decimal' : 'numeric', min, step, value: value ?? '' });
      return { input, el: suffix ? h('div', { class: 'input-suffix' }, input, h('span', { class: 'suf' }, suffix)) : input };
    };

    const nameIn = h('input', { class: 'input', id: 'f-name', type: 'text', maxlength: 40, placeholder: t('setup.namePh'), value: st.profile.name || '', autocomplete: 'name' });
    const bw = num('f-bw', toDisplayWeight(st.profile.weightKg), { min: 1, step: 0.1, suffix: unitLabel() });
    const exSel = h('select', { class: 'select', id: 'f-ex' },
      h('option', { value: '' }, t('setup.choose')),
      ...CATEGORIES.filter((c) => EXERCISES.some((e) => e.cats[0] === c)).map((c) => h('optgroup', { label: t('cats.' + c) },
        ...EXERCISES.filter((e) => e.cats[0] === c).map((e) => h('option', { value: e.id, selected: e.id === exId }, ex(e.id).name)))));
    const eqW = num('f-eq', 0, { min: 0, step: 0.5, suffix: unitLabel() });
    const reps = num('f-reps', exId ? byId[exId].reps : st.settings.defaultReps, { min: 1 });
    const sets = num('f-sets', exId ? byId[exId].sets : st.settings.defaultSets, { min: 1 });
    const rest = num('f-rest', program ? PROGRAMS[program].rest : exId ? byId[exId].rest : st.settings.defaultRest, { min: 0, suffix: t('common.sec') });
    const diff = h('select', { class: 'select', id: 'f-diff' }, ...['beginner', 'intermediate', 'advanced'].map((d) =>
      h('option', { value: d, selected: d === (program ? PROGRAMS[program].level : exId ? byId[exId].diff : st.settings.difficulty) }, t('diff.' + d))));
    const dur = num('f-dur', '', { min: 1, suffix: t('common.min') });
    let voiceOn = st.settings.voice, camOn = true;

    const F = {
      name: field(t('setup.participant'), nameIn, 'f-name'),
      bw: field(`${t('setup.bodyWeight')} (${unitLabel()})`, bw.el, 'f-bw'),
      ex: field(t('setup.exercise'), exSel, 'f-ex'),
      eq: field(`${t('setup.equipWeight')} (${unitLabel()})`, eqW.el, 'f-eq', t('setup.equipHint')),
      reps: field(t('setup.reps'), reps.el, 'f-reps'),
      sets: field(t('setup.sets'), sets.el, 'f-sets'),
      rest: field(t('setup.rest'), rest.el, 'f-rest'),
      diff: field(t('setup.difficulty'), diff, 'f-diff'),
      dur: field(`${t('setup.duration')} (${t('common.optional')})`, dur.el, 'f-dur', t('setup.durationHint')),
    };

    const grid = h('div', { class: 'form-grid' });
    grid.append(F.name.wrap, F.bw.wrap);
    if (program) {
      const list = h('ul', { class: 'program-list full' }, ...PROGRAMS[program].items.map((it) => {
        const e = byId[it.exId];
        return h('li', {}, demoIcon(e.demo, 1, 40), h('b', {}, ex(e.id).name), h('span', {}, `${it.sets} × ${it.reps}${e.hold ? t('common.sec') : ''}`));
      }));
      grid.append(h('div', { class: 'field full' }, h('span', { class: 'label' }, t('setup.exercise')), list));
      grid.append(F.eq.wrap, F.rest.wrap, F.diff.wrap, F.dur.wrap);
    } else {
      F.ex.wrap.classList.add('full');
      grid.append(F.ex.wrap, F.eq.wrap, F.reps.wrap, F.sets.wrap, F.rest.wrap, F.diff.wrap, F.dur.wrap);
    }

    const toggles = h('div', { class: 'full' },
      h('div', { class: 'toggle-row' }, h('div', { class: 'txt' }, h('b', {}, t('setup.voice')), h('span', {}, t('settings.voiceOn'))), toggle(voiceOn, (v) => (voiceOn = v), t('setup.voice'))),
      h('div', { class: 'toggle-row' }, h('div', { class: 'txt' }, h('b', {}, t('setup.camera')), h('span', {}, t('setup.privacy'))), toggle(camOn, (v) => (camOn = v), t('setup.camera'))));
    grid.append(toggles);

    const startBtn = h('button', { class: 'btn btn-primary lg block', type: 'submit' }, icon('play', 'sm'), t('setup.start'));
    const form = h('form', { class: 'glass card', novalidate: true }, grid, h('div', { style: { marginTop: '22px' } }, startBtn));

    // ---------- preview side ----------
    const previewArt = h('div', { class: 'art' });
    const previewName = h('h3', { class: 'display', style: { fontSize: '1.8rem' } });
    const previewMeta = h('p', { class: 'muted small' });
    const drawPreview = () => {
      const e = program ? byId[PROGRAMS[program].items[0].exId] : byId[exSel.value];
      previewArt.innerHTML = '';
      previewArt.append(e ? demoIcon(e.demo, 1, 190) : icon('dumbbell', 'lg'));
      previewName.textContent = program ? t('home.s4.' + program) : e ? ex(e.id).name : t('setup.choose');
      previewMeta.textContent = e ? `${t('view.' + e.view)} · ${ex(e.id).muscles}` : '';
      F.reps.wrap.querySelector('label').textContent = e && e.hold ? t('setup.holdSecs') : t('setup.reps');
    };
    exSel.addEventListener('change', () => {
      const e = byId[exSel.value];
      if (e) { reps.input.value = e.reps; sets.input.value = e.sets; rest.input.value = e.rest; diff.value = e.diff; if (!e.load) eqW.input.value = 0; }
      drawPreview();
    });
    drawPreview();

    const aside = h('aside', { class: 'stack' },
      h('div', { class: 'glass preview-card' }, previewArt, h('div', { class: 'card' }, previewName, previewMeta)),
      h('div', { class: 'glass card' },
        h('div', { class: 'card-title' }, icon('camera'), t('setup.tipsTitle')),
        h('ul', { class: 'tips' }, ...t('setup.tips').map((x) => h('li', {}, icon('check', 'sm'), x)))),
      notice(t('setup.privacy'), 'ok', 'lock'));

    page.append(h('div', { class: 'setup' }, form, aside));
    root.append(page);

    // ---------- validation ----------
    const setErr = (f, input, msg) => {
      f.err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) input.setAttribute('aria-describedby', f.err.id); else input.removeAttribute('aria-describedby');
      return !msg;
    };
    const isInt = (v) => /^\d+$/.test(String(v).trim());

    function validate() {
      let ok = true;
      const name = nameIn.value.trim();
      ok &= setErr(F.name, nameIn, !name || name.length > 40 ? t('setup.errors.name') : '');
      const bwKg = fromDisplayWeight(bw.input.value);
      ok &= setErr(F.bw, bw.input, !(bw.input.value !== '' && bwKg >= 20 && bwKg <= 350) ? t('setup.errors.weight') : '');
      const eqKg = fromDisplayWeight(eqW.input.value || 0);
      ok &= setErr(F.eq, eqW.input, !(eqW.input.value === '' || (Number(eqW.input.value) >= 0 && eqKg <= 300)) ? t('setup.errors.equip') : '');
      if (!program) {
        ok &= setErr(F.ex, exSel, !byId[exSel.value] ? t('setup.errors.exercise') : '');
        ok &= setErr(F.reps, reps.input, !(isInt(reps.input.value) && +reps.input.value >= 1 && +reps.input.value <= 200) ? t('setup.errors.reps') : '');
        ok &= setErr(F.sets, sets.input, !(isInt(sets.input.value) && +sets.input.value >= 1 && +sets.input.value <= 20) ? t('setup.errors.sets') : '');
      }
      ok &= setErr(F.rest, rest.input, !(isInt(rest.input.value) && +rest.input.value <= 600) ? t('setup.errors.rest') : '');
      ok &= setErr(F.dur, dur.input, dur.input.value !== '' && !(isInt(dur.input.value) && +dur.input.value >= 1 && +dur.input.value <= 180) ? t('setup.errors.duration') : '');
      return !!ok;
    }
    [nameIn, bw.input, exSel, eqW.input, reps.input, sets.input, rest.input, dur.input].forEach((el) =>
      el.addEventListener('blur', () => { if (el.getAttribute('aria-invalid') === 'true') validate(); }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) {
        toast(t('setup.errors.fix'), 'error');
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      const bwKg = Math.round(fromDisplayWeight(bw.input.value) * 10) / 10;
      const eqKg = Math.round(fromDisplayWeight(eqW.input.value || 0) * 10) / 10;
      // remember name + body weight in the profile and weight log
      store.update((s) => {
        s.profile.name = nameIn.value.trim();
        if (s.profile.weightKg !== bwKg) s.weights.push({ date: new Date().toISOString(), kg: bwKg });
        s.profile.weightKg = bwKg;
      }, 'profile');
      const items = program
        ? PROGRAMS[program].items.map((it) => ({ exId: it.exId, sets: it.sets, reps: it.reps, weightKg: byId[it.exId].load ? eqKg : 0, hold: !!byId[it.exId].hold }))
        : [{ exId: exSel.value, sets: +sets.input.value, reps: +reps.input.value, weightKg: eqKg, hold: !!byId[exSel.value].hold }];
      setPlan({
        name: nameIn.value.trim(), bodyWeightKg: bwKg, difficulty: diff.value, rest: +rest.input.value,
        durationMin: dur.input.value ? +dur.input.value : null, voice: voiceOn, camera: camOn, program, items,
      });
      navigate('/workout');
    });
  },
};
