// =========================================================
// workout.js — the live AI personal trainer screen.
//
// Flow:  loading → countdown → active set → rest → … → summary
// With the camera on, every video frame goes through:
//   MediaPipe pose → analyzers.js (angles, reps, checks)
//   → skeleton colours + text feedback + spoken coaching.
// Without the camera (blocked / no webcam / user choice) the
// same screen works in MANUAL mode: tap +1 rep, timers still run.
// =========================================================
import { h, fmtTime, uid } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t, ex } from '../core/i18n.js';
import { store } from '../core/store.js';
import { navigate, setGuard } from '../core/router.js';
import { ring, confirmDialog, toggle, notice } from '../core/ui.js';
import { byId } from '../data/exercises.js';
import { getPlan, clearPlan } from '../services/session.js';
import { createEngine } from '../ai/analyzers.js';
import { loadPoseModel, startCamera, stopCamera, detect, drawSkeleton } from '../ai/pose.js';
import { speak, hasVoice, stopSpeaking, speechSupported } from '../ai/voice.js';
import { beep, unlockAudio } from '../services/sound.js';
import { estimateCalories } from '../services/stats.js';
import { checkAchievements } from '../services/achievements.js';
import { fbText } from './exercise.js';

export default {
  shot: 'workout',
  render(root) {
    const plan = getPlan();
    if (!plan || !plan.items?.length) { navigate('/setup'); return; }
    const S = store.get().settings;

    // ---------------- state ----------------
    const W = {
      phase: 'loading', // loading | error | countdown | active | rest | paused | done
      itemIdx: 0, setIdx: 0, manual: !plan.camera,
      elapsed: 0, lastTick: performance.now(), countdownEnd: 0, restEnd: 0, pausedFrom: null,
      engine: null, stream: null, raf: 0, lastUi: 0, lastStatus: 'idle', lastMsg: null, voiceWarned: false,
      results: plan.items.map((it) => ({ ...it, setsDone: [], issues: {}, activeSec: 0 })),
      startedAt: new Date().toISOString(), finished: false, wakeLock: null, goodStreak: 0, setStart: 0,
    };
    const cur = () => plan.items[W.itemIdx];
    const curEx = () => byId[cur().exId];
    const leniency = { beginner: 8, intermediate: 0, advanced: -5 }[plan.difficulty] || 0;

    // ---------------- DOM ----------------
    const video = h('video', { playsinline: true, muted: true, autoplay: true });
    const canvas = h('canvas');
    const ctx = canvas.getContext('2d');
    const banner = h('div', { class: 'fb-banner', 'data-status': 'idle', role: 'status', 'aria-live': 'polite' }, h('span', { class: 'dot' }), h('span', { class: 'txt' }, t('workout.scanning')));
    const viewHint = h('div', { class: 'view-hint' });
    const overlay = h('div', { class: 'stage-overlay' });
    const stage = h('div', { class: `stage ${S.mirrorCamera ? 'mirror' : ''}`, 'data-status': 'idle' },
      video, canvas, h('div', { class: 'scanline' }), h('i', { class: 'corner c1' }), h('i', { class: 'corner c2' }), h('i', { class: 'corner c3' }), h('i', { class: 'corner c4' }),
      h('div', { class: 'frame-border' }), viewHint, banner, overlay);

    const title = h('h1', { class: 'display metal' });
    const setPill = h('span', { class: 'pill' });
    const itemPill = h('span', { class: 'pill' });
    const timerEl = h('div', { class: 'timer', 'aria-label': t('workout.time') }, icon('clock'), h('span', {}, '0:00'));
    const top = h('div', { class: 'wo-top glass' }, title, setPill, itemPill, timerEl);

    const ringBox = h('div');
    const statusPill = h('span', { class: 'status-pill', 'data-status': 'idle' }, t('workout.statusIdle'));
    const scoreEl = h('span', { class: 'muted small' });
    const setsDots = h('div', { class: 'sets-dots' });
    const counter = h('div', { class: 'counter glass' }, ringBox, statusPill, setsDots, scoreEl);
    const logList = h('ul');
    const log = h('div', { class: 'coach-log glass' }, h('div', { class: 'card-title' }, icon('message'), t('workout.tips')), logList);
    const stepsBox = h('div', { class: 'mini-steps glass' });
    const side = h('div', { class: 'wo-side' }, counter, log, stepsBox);

    const pauseBtn = h('button', { class: 'btn btn-ghost', onclick: togglePause }, icon('pause', 'sm'), t('workout.pause'));
    const stopBtn = h('button', { class: 'btn btn-danger', onclick: askStop }, icon('stop', 'sm'), t('workout.stop'));
    const minusBtn = h('button', { class: 'btn btn-ghost', 'aria-label': t('workout.minusRep'), onclick: () => adjustRep(-1) }, t('workout.minusRep'));
    const plusBtn = h('button', { class: 'btn btn-primary big-rep', onclick: () => adjustRep(1) }, icon('plus', 'sm'), t('workout.addRep'));
    const skipBtn = h('button', { class: 'btn btn-ghost hidden', onclick: () => endRest() }, icon('skipNext', 'sm'), t('workout.skipRest'));
    const voiceT = h('label', { class: 'ctl-toggle' }, toggle(S.voice, (v) => store.update((s) => (s.settings.voice = v), 'settings'), t('workout.voice')), t('workout.voice'));
    const skelT = h('label', { class: 'ctl-toggle' }, toggle(S.showSkeleton, (v) => store.update((s) => (s.settings.showSkeleton = v), 'settings'), t('workout.skeleton')), t('workout.skeleton'));
    const mirrorT = h('label', { class: 'ctl-toggle' }, toggle(S.mirrorCamera, (v) => { store.update((s) => (s.settings.mirrorCamera = v), 'settings'); stage.classList.toggle('mirror', v); }, t('workout.mirror')), t('workout.mirror'));
    const controls = h('div', { class: 'wo-controls glass' }, pauseBtn, minusBtn, plusBtn, skipBtn, stopBtn, voiceT, skelT, mirrorT);

    const wrap = h('div', { class: 'wo' }, top, h('div', { class: 'wo-main' }, stage, side), controls,
      h('p', { class: 'hint', style: { textAlign: 'center' } }, t('workout.limits')));
    root.append(wrap);

    // ---------------- helpers ----------------
    const target = () => cur().reps;
    const isHold = () => !!curEx().hold;
    const progressValue = () => (isHold() ? W.engine.holdSec : W.engine.reps);

    function addLog(text, status = 'ok') {
      if (logList.firstChild?.textContent === text) return;
      logList.prepend(h('li', { class: status }, h('i'), h('span', {}, text)));
      while (logList.children.length > 6) logList.lastChild.remove();
    }
    function say(text, opts) {
      const spoken = speak(text, opts);
      if (!spoken && store.get().settings.voice && !W.voiceWarned && speechSupported() && !hasVoice()) {
        W.voiceWarned = true;
        addLog(t('settings.noVoice'), 'warn');
      }
      return spoken;
    }
    function setBanner(text, status) {
      banner.dataset.status = status; stage.dataset.status = status;
      banner.querySelector('.txt').textContent = text;
    }
    function overlayShow(content) { overlay.innerHTML = ''; overlay.append(content); overlay.classList.remove('hidden'); }
    function overlayHide() { overlay.classList.add('hidden'); overlay.innerHTML = ''; }

    function drawHeader() {
      const e = curEx();
      title.textContent = ex(e.id).name;
      setPill.textContent = t('workout.set', { a: W.setIdx + 1, b: cur().sets });
      itemPill.textContent = `${W.itemIdx + 1} / ${plan.items.length}`;
      itemPill.classList.toggle('hidden', plan.items.length < 2);
      viewHint.replaceChildren(icon('camera', 'sm'), h('span', {}, `${t('exercise.camera')}: ${t('view.' + e.view)}`));
      stepsBox.replaceChildren(h('div', { class: 'card-title' }, icon('list'), t('exercise.steps')), h('ol', {}, ...ex(e.id).steps.map((s) => h('li', {}, s))));
      setsDots.replaceChildren(...Array.from({ length: cur().sets }, (_, i) => h('i', { class: i < W.setIdx ? 'done' : i === W.setIdx ? 'now' : '' })));
      plusBtn.classList.toggle('hidden', isHold());
      minusBtn.classList.toggle('hidden', isHold());
    }
    let lastRingKey = '';
    function drawCounter(status = W.lastStatus) {
      const v = progressValue(), tg = target();
      const key = `${Math.floor(v)}|${tg}|${status}`;
      if (key === lastRingKey) return;
      lastRingKey = key;
      const label = isHold()
        ? [h('b', {}, `${Math.floor(v)}`), h('span', {}, `${t('workout.holdTarget', { n: tg })}`)]
        : [h('b', {}, `${v}`), h('span', {}, `${t('workout.target')}: ${tg}`)];
      const r = ring(v / tg, 190, 14, label);
      r.classList.add(status);
      ringBox.replaceChildren(r);
      const sc = W.engine.score();
      scoreEl.textContent = W.manual ? t('workout.manualMode') : sc === null ? '' : `${t('workout.score')}: ${sc}%`;
    }
    function setStatus(status, msgKey) {
      W.lastStatus = status;
      statusPill.dataset.status = status;
      statusPill.textContent = t({ ok: 'workout.statusOk', warn: 'workout.statusWarn', bad: 'workout.statusBad' }[status] || 'workout.statusIdle');
      if (msgKey) setBanner(fbText(msgKey), status);
    }

    // ---------------- flow ----------------
    function newEngineForItem() {
      W.engine = createEngine(curEx().ai, { leniency });
    }

    function startCountdown({ announce = true, seconds = null } = {}) {
      W.phase = 'countdown';
      drawHeader();
      const secs = seconds ?? Math.max(0, store.get().settings.countdown | 0);
      if (announce && W.setIdx === 0) say(t('voice.start', { ex: ex(curEx().id).name, n: cur().sets, r: cur().reps }), { priority: 'high' });
      else if (announce) say(t('voice.nextSet', { n: W.setIdx + 1 }), { priority: 'high' });
      if (secs <= 0) return beginSet();
      W.countdownEnd = performance.now() + secs * 1000;
      let lastShown = null;
      const tickCd = () => {
        if (W.phase !== 'countdown') return;
        const left = Math.ceil((W.countdownEnd - performance.now()) / 1000);
        if (left !== lastShown) {
          lastShown = left;
          if (left > 0) {
            overlayShow(h('div', { class: 'box' }, h('div', { class: 'eyebrow' }, t('workout.ready')), h('div', { class: 'countdown' }, left), h('p', {}, ex(curEx().id).start)));
            beep('tick');
          }
        }
        if (left <= 0) { beginSet(); return; }
        setTimeout(tickCd, 100);
      };
      tickCd();
    }
    function beginSet() {
      overlayShow(h('div', { class: 'box' }, h('div', { class: 'countdown' }, t('workout.go'))));
      setTimeout(() => { if (W.phase === 'active') overlayHide(); }, 650);
      beep('go');
      W.phase = 'active';
      W.setStart = performance.now();
      W.engine.resetSet();
      lastRingKey = '';
      drawCounter('idle');
      if (W.manual) setBanner(t('workout.manualMode'), 'idle');
    }

    function completeSet() {
      const r = W.results[W.itemIdx];
      const issues = W.engine.issues();
      for (const [k, n] of Object.entries(issues)) r.issues[k] = (r.issues[k] || 0) + n;
      r.setsDone.push({
        reps: isHold() ? 0 : W.engine.reps,
        holdSec: isHold() ? Math.round(W.engine.holdSec) : 0,
        formScore: W.manual ? null : W.engine.score(),
        manual: W.manual,
      });
      r.activeSec += (performance.now() - W.setStart) / 1000;
      W.engine.resetScore();
      beep('done');
      addLog(t('voice.setDone'), 'ok');
      W.setIdx++;
      const moreSets = W.setIdx < cur().sets;
      const moreItems = W.itemIdx < plan.items.length - 1;
      if (!moreSets && !moreItems) return finish();
      if (!moreSets) { W.itemIdx++; W.setIdx = 0; newEngineForItem(); }
      startRest();
    }

    function startRest({ seconds = plan.rest, announce = true } = {}) {
      const secs = plan.rest;
      if (announce) say(`${t('voice.setDone')} ${secs ? t('voice.rest', { n: secs }) : ''}`, { priority: 'high' });
      if (!secs || seconds <= 0) return startCountdown();
      W.phase = 'rest';
      W.restEnd = performance.now() + seconds * 1000;
      skipBtn.classList.remove('hidden');
      setStatus('idle');
      setBanner(t('workout.rest'), 'idle');
      const nextLabel = W.setIdx === 0 ? ex(curEx().id).name : t('workout.next', { n: W.setIdx + 1 });
      const timeEl = h('div', { class: 'rest-time' });
      const ringHolder = h('div');
      overlayShow(h('div', { class: 'box' }, h('div', { class: 'eyebrow' }, t('workout.rest')), ringHolder, h('p', {}, nextLabel),
        h('button', { class: 'btn btn-primary', onclick: () => endRest() }, icon('skipNext', 'sm'), t('workout.skipRest'))));
      let lastSec = -1;
      const tickRest = () => {
        if (W.phase !== 'rest') return;
        const left = Math.max(0, (W.restEnd - performance.now()) / 1000);
        const s = Math.ceil(left);
        if (s !== lastSec) {
          lastSec = s;
          timeEl.textContent = fmtTime(s);
          ringHolder.replaceChildren(ring(1 - left / secs, 150, 10, [timeEl]));
          if (s <= 3 && s > 0) beep('tick');
        }
        if (left <= 0) return endRest();
        setTimeout(tickRest, 200);
      };
      tickRest();
    }
    function endRest() {
      if (W.phase !== 'rest') return;
      skipBtn.classList.add('hidden');
      startCountdown();
    }

    function adjustRep(d) {
      if (W.phase !== 'active' || isHold()) return;
      d > 0 ? W.engine.addRep() : W.engine.removeRep();
      if (d > 0) { beep('rep'); onRep(); }
      drawCounter();
    }
    function onRep() {
      const left = target() - W.engine.reps;
      const mode = store.get().settings.voiceEvery;
      if (mode !== 'corrections') {
        if (left === 3) say(t('voice.repsLeft', { n: 3 }), { priority: 'high' });
        else if (left === 1) say(t('voice.oneMore'), { priority: 'high' });
        else if (W.engine.reps === Math.floor(target() / 2) && target() >= 8) say(t('voice.halfway'), { priority: 'high' });
        else if (left > 0) say(String(W.engine.reps), { priority: 'high' });
      }
      if (left <= 0) completeSet();
    }

    function togglePause() {
      if (W.phase === 'paused') {
        W.phase = W.pausedFrom.phase;
        const pausedMs = performance.now() - W.pausedFrom.at;
        W.restEnd += pausedMs; W.countdownEnd += pausedMs; W.setStart += pausedMs;
        const remaining = (end) => Math.max(0, (end - performance.now()) / 1000);
        if (W.phase === 'rest') startRest({ seconds: remaining(W.restEnd), announce: false });
        if (W.phase === 'countdown') startCountdown({ announce: false, seconds: Math.ceil(remaining(W.countdownEnd)) });
        if (W.phase === 'active') overlayHide();
        pauseBtn.replaceChildren(icon('pause', 'sm'), t('workout.pause'));
      } else if (['active', 'rest', 'countdown'].includes(W.phase)) {
        W.pausedFrom = { phase: W.phase, at: performance.now() };
        W.phase = 'paused';
        stopSpeaking();
        overlayShow(h('div', { class: 'box' }, h('h2', {}, t('workout.paused')), h('button', { class: 'btn btn-primary lg', onclick: togglePause }, icon('play', 'sm'), t('workout.resume'))));
        pauseBtn.replaceChildren(icon('play', 'sm'), t('workout.resume'));
      }
    }

    async function askStop() {
      const wasPaused = W.phase === 'paused';
      if (!wasPaused) togglePause();
      const ok = await confirmDialog({ title: t('workout.stopTitle'), message: t('workout.stopText'), confirmText: t('workout.stopYes'), cancelText: t('workout.stopNo'), danger: true });
      if (ok) finish(true);
      else if (!wasPaused) togglePause();
    }

    // ---------------- saving ----------------
    function finish(early = false) {
      if (W.finished) return;
      W.finished = true;
      if (early && W.phase !== 'loading' && W.phase !== 'error') {
        // keep the set in progress if anything was done
        const prog = W.engine ? (isHold() ? W.engine.holdSec : W.engine.reps) : 0;
        if (prog > 0 && (W.phase === 'active' || W.pausedFrom?.phase === 'active')) {
          const r = W.results[W.itemIdx];
          r.setsDone.push({ reps: isHold() ? 0 : W.engine.reps, holdSec: isHold() ? Math.round(W.engine.holdSec) : 0, formScore: W.manual ? null : W.engine.score(), manual: W.manual });
          r.activeSec += (performance.now() - W.setStart) / 1000;
          for (const [k, n] of Object.entries(W.engine.issues())) r.issues[k] = (r.issues[k] || 0) + n;
        }
      }
      W.phase = 'done';
      cleanup();
      const items = W.results.filter((r) => r.setsDone.length).map((r) => ({
        exId: r.exId, repsPlanned: r.reps, setsPlanned: r.sets, hold: r.hold, weightKg: r.weightKg, sets: r.setsDone, issues: r.issues,
        activeSec: Math.round(r.activeSec),
      }));
      if (!items.length) { clearPlan(); navigate('/setup'); return; }
      const scores = items.flatMap((i) => i.sets.map((s) => s.formScore)).filter((x) => typeof x === 'number');
      const record = {
        id: uid(), date: W.startedAt, endedAt: new Date().toISOString(), durationSec: Math.round(W.elapsed),
        name: plan.name, bodyWeightKg: plan.bodyWeightKg, difficulty: plan.difficulty, program: plan.program,
        items, totalReps: items.reduce((a, i) => a + i.sets.reduce((b, s) => b + (s.reps || 0), 0), 0),
        formScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        // estimate: exercise MET during active time + light activity (MET 1.5) while resting
        calories: items.reduce((a, i) => a + estimateCalories(byId[i.exId].met, plan.bodyWeightKg, i.activeSec), 0)
          + estimateCalories(1.5, plan.bodyWeightKg, Math.max(0, W.elapsed - items.reduce((a, i) => a + i.activeSec, 0))),
        manual: items.every((i) => i.sets.every((s) => s.manual)),
      };
      store.update((s) => s.workouts.push(record), 'workout');
      const fresh = checkAchievements();
      say(t('voice.done'), { priority: 'high', force: false });
      clearPlan();
      navigate(`/summary/${record.id}${fresh.length ? '?new=' + fresh.join(',') : ''}`);
    }

    // ---------------- main loop ----------------
    function loop(now) {
      W.raf = requestAnimationFrame(loop);
      const dt = (now - W.lastTick) / 1000;
      W.lastTick = now;
      if (W.phase !== 'paused' && W.phase !== 'loading' && W.phase !== 'error' && W.phase !== 'done') W.elapsed += dt;
      if (plan.durationMin && W.elapsed >= plan.durationMin * 60 && !W.finished) { addLog(t('workout.timeUp'), 'warn'); return finish(true); }

      let res = null;
      if (!W.manual && W.stream && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
        const lm = detect(video, now);
        stage.classList.toggle('tracking', !!lm);
        if (W.phase === 'active') {
          res = W.engine.update(lm, now, video.videoWidth / video.videoHeight);
          if (res.repDone) { beep('rep'); onRepFromAI(res); }
        }
        if (store.get().settings.showSkeleton) drawSkeleton(ctx, lm, res ? res.status : lm ? 'idle' : 'idle', res ? res.bad : []);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (W.manual && W.phase === 'active' && isHold()) {
        W.engine.addHoldTime(dt * 1000); // manual mode: the hold timer simply runs
      }

      // hold exercises: complete when target reached
      if (W.phase === 'active' && isHold()) {
        const held = W.engine.holdSec;
        const left = Math.ceil(target() - held);
        if (left !== W._lastLeft && (left === 10 || left === 5)) say(t('voice.secondsLeft', { n: left }), { priority: 'high' });
        W._lastLeft = left;
        if (held >= target()) completeSet();
      }

      if (now - W.lastUi > 100) {
        W.lastUi = now;
        timerEl.lastChild.textContent = fmtTime(W.elapsed);
        if (W.phase === 'active') {
          if (res) {
            const msg = res.repMsg || res.msg || (res.status === 'ok' ? 'good' : null);
            setStatus(res.status, msg);
            if (res.msg && res.msg !== W.lastMsg && (res.status === 'warn' || res.status === 'bad')) {
              addLog(fbText(res.msg), res.status);
              if (store.get().settings.voiceEvery !== 'reps') say(fbText(res.msg), { minGap: 3500 });
            }
            W.lastMsg = res.msg;
          }
          drawCounter(res ? res.status : 'idle');
        }
      }
    }
    function onRepFromAI(res) {
      if (res.repMsg) {
        addLog(fbText(res.repMsg), 'warn');
        if (store.get().settings.voiceEvery !== 'reps') say(fbText(res.repMsg), { minGap: 1500 });
        W.goodStreak = 0;
      } else {
        W.goodStreak++;
        if (W.goodStreak % 5 === 0) { addLog(t('fb.great'), 'ok'); say(t('fb.great'), { minGap: 1500 }); }
      }
      onRep();
    }

    // ---------------- start-up ----------------
    function showError(kind) {
      W.phase = 'error';
      const map = {
        denied: [t('workout.deniedTitle'), t('workout.deniedText')], nocamera: [t('workout.noCamTitle'), t('workout.noCamText')],
        model: [t('workout.modelTitle'), t('workout.modelText')], insecure: [t('workout.deniedTitle'), t('workout.insecureText')],
        other: [t('workout.noCamTitle'), t('workout.noCamText')],
      };
      const [ti, tx] = map[kind] || map.other;
      overlayShow(h('div', { class: 'box' }, icon('alert', 'lg'), h('h2', {}, ti), h('p', {}, tx),
        h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
          h('button', { class: 'btn btn-ghost', onclick: () => boot() }, icon('repeat', 'sm'), t('workout.retry')),
          h('button', { class: 'btn btn-primary', onclick: () => { W.manual = true; stage.classList.add('tracking'); startCountdown(); } }, t('workout.manual')))));
    }

    async function boot() {
      W.phase = 'loading';
      unlockAudio();
      newEngineForItem();
      drawHeader();
      drawCounter('idle');
      if (W.manual) { stage.classList.add('tracking'); setBanner(t('workout.manualMode'), 'idle'); startCountdown(); return; }
      overlayShow(h('div', { class: 'box' }, h('div', { class: 'spinner' }), h('h2', {}, t('workout.loadingModel')), h('p', {}, t('workout.loadingHint'))));
      try {
        const camP = startCamera(video).then((s) => (W.stream = s));
        await Promise.all([camP, loadPoseModel().catch((e) => { e.code = 'model'; throw e; })]);
      } catch (e) {
        console.warn('Workout start problem:', e);
        if (W.stream && e.code === 'model') { stopCamera(W.stream); W.stream = null; }
        return showError(e.code || 'other');
      }
      setBanner(t('workout.scanning'), 'idle');
      startCountdown();
    }

    // keep the screen awake during the workout (if supported)
    navigator.wakeLock?.request('screen').then((l) => (W.wakeLock = l)).catch(() => {});

    function cleanup() {
      cancelAnimationFrame(W.raf);
      stopCamera(W.stream); W.stream = null;
      stopSpeaking();
      W.wakeLock?.release?.().catch(() => {});
      setGuard(null);
    }

    setGuard(async () => {
      if (W.finished) return true;
      const ok = await confirmDialog({ title: t('workout.leaveTitle'), message: t('workout.leaveText'), confirmText: t('workout.stopYes'), cancelText: t('workout.stopNo'), danger: true });
      if (ok) { finish(true); return false; } // finish() navigates to the summary itself
      return false;
    });

    W.raf = requestAnimationFrame(loop);
    boot();
    return () => { if (!W.finished) { W.finished = true; } cleanup(); };
  },
};
