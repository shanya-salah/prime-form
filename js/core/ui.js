// =========================================================
// ui.js — shared UI pieces: toasts, dialogs, confirm box,
// progress ring, switches, steppers, page headers.
// =========================================================
import { h } from './dom.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

// ---------- Toast messages ----------
export function toast(message, type = 'info', ms = 3200) {
  const root = document.getElementById('toast-root');
  const name = type === 'error' ? 'alert' : type === 'success' ? 'check' : 'info';
  const el = h('div', { class: `toast ${type}`, role: 'status' }, icon(name), h('span', {}, message));
  root.append(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
}

// ---------- Modal dialog ----------
export function openModal(content, { wide = false, onClose, dismissable = true } = {}) {
  const root = document.getElementById('modal-root');
  const box = h('div', { class: `modal glass ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true' }, content);
  const wrap = h('div', { class: 'modal-wrap' }, box);
  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && dismissable) close(); };
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap && dismissable) close(); });
  document.addEventListener('keydown', onKey);
  root.append(wrap);
  setTimeout(() => (box.querySelector('[autofocus], button, input, select') || box).focus(), 30);
  return { close, box };
}

/** A confirmation dialog that returns a Promise<boolean>. */
export function confirmDialog({ title, message, confirmText, cancelText, danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; m.close(); resolve(v); } };
    const m = openModal(
      h('div', {},
        h('h2', {}, title),
        h('p', { class: 'muted' }, message),
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => finish(false) }, cancelText || t('common.cancel')),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, autofocus: true, onclick: () => finish(true) }, confirmText || t('common.confirm'))
        )
      ),
      { onClose: () => { if (!done) { done = true; resolve(false); } } }
    );
  });
}

// ---------- Progress ring (SVG) ----------
export function ring(percent, size = 150, stroke = 12, label = null) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, percent));
  const svgNs = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(svgNs, 'svg');
  s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', `0 0 ${size} ${size}`);
  const mk = (cls) => {
    const ci = document.createElementNS(svgNs, 'circle');
    ci.setAttribute('cx', size / 2); ci.setAttribute('cy', size / 2); ci.setAttribute('r', r);
    ci.setAttribute('fill', 'none'); ci.setAttribute('stroke-width', stroke); ci.setAttribute('class', cls);
    return ci;
  };
  const bg = mk('ring-bg');
  const fg = mk('ring-fg');
  fg.setAttribute('stroke-dasharray', c);
  fg.setAttribute('stroke-dashoffset', c);
  s.append(bg, fg);
  // animate after it is on screen
  requestAnimationFrame(() => requestAnimationFrame(() => fg.setAttribute('stroke-dashoffset', c * (1 - p))));
  return h('div', { class: 'ring', style: { width: size + 'px', height: size + 'px' } }, s, label ? h('div', { class: 'ring-label' }, label) : null);
}

export function bar(percent) {
  const fill = h('i');
  requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = Math.round(Math.max(0, Math.min(1, percent)) * 100) + '%')));
  return h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': Math.round(percent * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }, fill);
}

export function toggle(checked, onChange, labelText) {
  const input = h('input', { type: 'checkbox', role: 'switch', 'aria-label': labelText || '' });
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'switch' }, input, h('span', { class: 'track' }));
}

export function segmented(options, value, onChange, ariaLabel = '') {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': ariaLabel });
  options.forEach(([val, label]) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(val === value) }, label);
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      onChange(val);
    });
    wrap.append(b);
  });
  return wrap;
}

/** Number input with − and + buttons. */
export function stepper({ value, min = 0, max = 999, step = 1, id, onInput }) {
  const input = h('input', { type: 'number', id, value, min, max, step, inputmode: 'decimal' });
  const bump = (d) => {
    const n = Number(input.value || 0) + d;
    const v = Math.max(min, Math.min(max, Math.round(n * 100) / 100));
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  if (onInput) input.addEventListener('input', () => onInput(input.value));
  return {
    el: h('div', { class: 'stepper' },
      h('button', { type: 'button', 'aria-label': t('common.decrease'), onclick: () => bump(-step) }, icon('minus', 'sm')),
      input,
      h('button', { type: 'button', 'aria-label': t('common.increase'), onclick: () => bump(step) }, icon('plus', 'sm'))
    ),
    input,
  };
}

export function pageHead(title, sub, extra) {
  return h('div', { class: 'page-head' },
    h('div', {},
      h('h1', { class: 'display metal page-title' }, title),
      sub ? h('p', { class: 'page-sub' }, sub) : null
    ),
    extra || null
  );
}

export function emptyState(iconName, title, text, action) {
  return h('div', { class: 'empty' }, icon(iconName), h('h3', {}, title), h('p', {}, text), action ? h('div', { style: { marginTop: '16px' } }, action) : null);
}

export function notice(text, type = '', iconName = 'info') {
  return h('div', { class: `notice ${type}` }, icon(iconName), h('div', {}, text));
}
