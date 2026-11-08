// =========================================================
// settings.js — every setting is applied and saved instantly.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, LANGS, lang } from '../core/i18n.js';
import { store } from '../core/store.js';
import { pageHead, toggle, segmented, toast, confirmDialog, notice } from '../core/ui.js';
import { speak, voicesForLang, speechSupported } from '../ai/voice.js';
import { beep } from '../services/sound.js';
import { startCamera, stopCamera } from '../ai/pose.js';
import { replayOnboarding } from '../components/onboarding.js';

const set = (fn) => store.update((s) => fn(s.settings), 'settings');

export default {
  shot: 'settings',
  render(root) {
    const S = store.get().settings;
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(t('settings.title'), t('settings.sub')));

    const row = (title, desc, control) => h('div', { class: 'set-row' }, h('div', { class: 'txt' }, h('b', {}, title), desc ? h('span', {}, desc) : null), h('div', { class: 'ctl' }, control));
    const section = (id, ic, title, ...rows) => h('section', { class: 'set-section glass', id: 'set-' + id }, h('h2', {}, icon(ic), title), ...rows);
    const numInput = (value, min, max, onChange) => {
      const i = h('input', { class: 'input', type: 'number', min, max, value, style: { width: '110px', height: '40px' } });
      i.addEventListener('change', () => {
        const v = Math.round(Number(i.value));
        if (!(v >= min && v <= max)) { i.setAttribute('aria-invalid', 'true'); toast(`${min}–${max}`, 'error'); return; }
        i.removeAttribute('aria-invalid'); onChange(v);
      });
      return i;
    };

    // ---- Language ----
    const langCards = h('div', { class: 'lang-cards' }, ...Object.values(LANGS).map((L) =>
      h('button', { class: 'lang-card', lang: L.code, dir: L.dir, 'aria-pressed': String(L.code === lang().code), onclick: () => set((s) => (s.lang = L.code)) },
        h('b', {}, L.label), h('span', {}, L.dir.toUpperCase()))));

    // ---- Voice ----
    const voiceSel = h('select', { class: 'select', style: { width: 'auto', minWidth: '200px', height: '40px' }, 'aria-label': t('settings.voicePick') });
    const voiceInfo = h('div');
    const fillVoices = () => {
      const list = voicesForLang();
      voiceSel.replaceChildren(h('option', { value: '' }, t('settings.auto')), ...list.map((v) => h('option', { value: v.name, selected: v.name === store.get().settings.voiceName }, `${v.name} (${v.lang})`)));
      voiceInfo.replaceChildren(!speechSupported() || !list.length ? notice(t('settings.noVoice'), 'warn', 'alert') : notice(t('settings.voiceOk', { n: list.length }), 'ok', 'check'));
    };
    fillVoices();
    speechSupported() && window.speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
    voiceSel.addEventListener('change', () => set((s) => (s.voiceName = voiceSel.value)));
    const rate = h('input', { type: 'range', min: 0.6, max: 1.4, step: 0.1, value: S.voiceRate, style: { width: '160px' }, 'aria-label': t('settings.rate') });
    rate.addEventListener('change', () => set((s) => (s.voiceRate = Number(rate.value))));
    const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.1, value: S.soundVolume, style: { width: '160px' }, 'aria-label': t('settings.volume') });
    vol.addEventListener('change', () => { set((s) => (s.soundVolume = Number(vol.value))); beep('rep', true); });

    // ---- Camera ----
    const camStatus = h('span', { class: 'badge neutral' }, t('settings.unknown'));
    const checkPerm = async () => {
      try {
        const r = await navigator.permissions?.query({ name: 'camera' });
        if (r) { camStatus.textContent = t('settings.' + (r.state === 'granted' ? 'granted' : r.state === 'denied' ? 'denied' : 'prompt')); r.onchange = checkPerm; }
      } catch { camStatus.textContent = t('settings.unknown'); }
    };
    checkPerm();
    const testCam = h('button', { class: 'btn btn-ghost sm' }, icon('camera', 'sm'), t('settings.checkCam'));
    testCam.addEventListener('click', async () => {
      const v = h('video');
      try { const s = await startCamera(v); stopCamera(s); toast(t('settings.camOk'), 'success'); }
      catch (e) { toast(e.code === 'insecure' ? t('workout.insecureText') : t('settings.camFail'), 'error', 6000); }
      checkPerm();
    });

    // ---- Data ----
    const exportBtn = h('button', { class: 'btn btn-ghost sm' }, icon('download', 'sm'), t('settings.export'));
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `primeform-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    const fileIn = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' });
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files[0]; if (!f) return;
      try { store.importJSON(await f.text()); toast(t('settings.imported'), 'success'); }
      catch { toast(t('settings.importErr'), 'error'); }
      fileIn.value = '';
    });
    const importBtn = h('button', { class: 'btn btn-ghost sm', onclick: () => fileIn.click() }, icon('upload', 'sm'), t('settings.import'));
    const clearBtn = h('button', { class: 'btn btn-danger sm' }, icon('trash', 'sm'), t('settings.clear'));
    clearBtn.addEventListener('click', async () => {
      if (await confirmDialog({ title: t('settings.clearT'), message: t('settings.clearX'), confirmText: t('common.delete'), danger: true })) { store.reset(); toast(t('settings.cleared'), 'success'); }
    });

    const sections = [
      ['language', 'globe', t('settings.language'), langCards],
      ['appearance', 'sun', t('settings.appearance'),
        row(t('settings.theme'), null, segmented([['dark', t('settings.dark')], ['light', t('settings.light')]], S.theme, (v) => set((s) => (s.theme = v)), t('settings.theme'))),
        row(t('settings.accent'), null, segmented([['gold', t('settings.gold')], ['lime', t('settings.lime')]], S.accent, (v) => set((s) => (s.accent = v)), t('settings.accent'))),
        row(t('settings.background'), t('settings.bgHint'), segmented([['3d', t('settings.bg3d')], ['photos', t('settings.bgPhotos')], ['off', t('settings.bgOff')]], S.background, (v) => set((s) => (s.background = v)), t('settings.background')))],
      ['sound', 'volume', t('settings.sound'),
        row(t('settings.soundOn'), null, toggle(S.sound, (v) => set((s) => (s.sound = v)), t('settings.soundOn'))),
        row(t('settings.volume'), null, h('div', { class: 'row' }, vol, h('button', { class: 'btn btn-ghost sm', onclick: () => beep('done', true) }, t('common.test'))))],
      ['voice', 'mic', t('settings.voice'),
        row(t('settings.voiceOn'), null, toggle(S.voice, (v) => set((s) => (s.voice = v)), t('settings.voiceOn'))),
        row(t('settings.voiceMode'), null, segmented([['smart', t('settings.vmSmart')], ['reps', t('settings.vmReps')], ['corrections', t('settings.vmFix')]], S.voiceEvery, (v) => set((s) => (s.voiceEvery = v)), t('settings.voiceMode'))),
        row(t('settings.voicePick'), null, h('div', { class: 'row' }, voiceSel, h('button', { class: 'btn btn-ghost sm', onclick: () => { if (!speak(t('fb.great'), { priority: 'high', force: true })) toast(t('settings.noVoice'), 'error', 5000); } }, icon('play', 'sm'), t('common.test')))),
        row(t('settings.rate'), null, rate), voiceInfo],
      ['camera', 'camera', t('settings.camera'), h('p', { class: 'muted small', style: { margin: '6px 0 4px' } }, t('settings.camInfo')),
        row(t('settings.camStatus'), null, h('div', { class: 'row' }, camStatus, testCam)),
        row(t('settings.mirror'), null, toggle(S.mirrorCamera, (v) => set((s) => (s.mirrorCamera = v)), t('settings.mirror'))),
        row(t('settings.skeleton'), null, toggle(S.showSkeleton, (v) => set((s) => (s.showSkeleton = v)), t('settings.skeleton')))],
      ['workout', 'dumbbell', t('settings.workout'),
        row(t('settings.dSets'), null, numInput(S.defaultSets, 1, 20, (v) => set((s) => (s.defaultSets = v)))),
        row(t('settings.dReps'), null, numInput(S.defaultReps, 1, 200, (v) => set((s) => (s.defaultReps = v)))),
        row(t('settings.dRest'), null, numInput(S.defaultRest, 0, 600, (v) => set((s) => (s.defaultRest = v)))),
        row(t('settings.countdown'), null, numInput(S.countdown, 0, 15, (v) => set((s) => (s.countdown = v)))),
        row(t('settings.dDiff'), null, segmented(['beginner', 'intermediate', 'advanced'].map((d) => [d, t('diff.' + d)]), S.difficulty, (v) => set((s) => (s.difficulty = v)), t('settings.dDiff')))],
      ['units', 'ruler', t('settings.units'),
        row(t('settings.units'), null, segmented([['kg', t('settings.kgs')], ['lb', t('settings.lbs')]], S.units, (v) => set((s) => (s.units = v)), t('settings.units')))],
      ['profile', 'user', t('settings.profile'),
        row(store.get().profile.name || t('nav.profile'), null, h('a', { class: 'btn btn-ghost sm', href: '#/profile' }, t('settings.editProfile')))],
      ['a11y', 'accessibility', t('settings.a11y'),
        row(t('settings.large'), null, toggle(S.largeText, (v) => set((s) => (s.largeText = v)), t('settings.large'))),
        row(t('settings.contrast'), null, toggle(S.highContrast, (v) => set((s) => (s.highContrast = v)), t('settings.contrast'))),
        row(t('settings.motion'), null, toggle(S.reduceMotion, (v) => set((s) => (s.reduceMotion = v)), t('settings.motion')))],
      ['data', 'shield', t('settings.data'), h('p', { class: 'muted small', style: { margin: '6px 0 10px' } }, t('settings.dataInfo')),
        h('div', { class: 'row wrap' }, exportBtn, importBtn, fileIn, clearBtn,
          h('button', { class: 'btn btn-text', onclick: replayOnboarding }, t('settings.replay')))],
    ];

    const nav = h('nav', { class: 'settings-nav glass', 'aria-label': t('settings.title') },
      ...sections.map(([id, ic, title]) => h('a', { href: '#/settings', onclick: (e) => { e.preventDefault(); document.getElementById('set-' + id).scrollIntoView({ behavior: 'smooth' }); } }, icon(ic, 'sm'), title)));
    page.append(h('div', { class: 'settings' }, nav, h('div', {}, ...sections.map(([id, ic, title, ...rows]) => section(id, ic, title, ...rows)))));
    root.append(page);
  },
};
