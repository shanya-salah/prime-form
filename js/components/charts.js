// =========================================================
// charts.js — small SVG charts (no library needed).
//   lineChart(points)  points: [{ label, value, tip }]
//   barChart(points)   vertical bars
//   hbarChart(points)  horizontal bars (labels on the start side)
// Single-series charts: one accent colour, thin marks, quiet grid,
// hover tooltip on every mark, and a hidden data table for screen readers.
// =========================================================
import { h, svg } from '../core/dom.js';

let tip;
function tooltip() {
  if (!tip) { tip = h('div', { class: 'chart-tip', role: 'tooltip' }); document.body.append(tip); }
  return tip;
}
function bindTip(el, text) {
  el.addEventListener('pointerenter', () => { const t = tooltip(); t.textContent = text; t.style.opacity = '1'; });
  el.addEventListener('pointermove', (e) => { const t = tooltip(); t.style.left = e.clientX + 12 + 'px'; t.style.top = e.clientY - 34 + 'px'; });
  el.addEventListener('pointerleave', () => { tooltip().style.opacity = '0'; });
}
export function hideTip() { if (tip) tip.style.opacity = '0'; }

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const rtl = () => document.dir === 'rtl';

function table(points, caption) {
  return h('table', { class: 'sr-only' }, h('caption', {}, caption || ''),
    h('tbody', {}, ...points.map((p) => h('tr', {}, h('th', {}, p.label), h('td', {}, p.tip || p.value)))));
}

export function lineChart(points, { height = 240, caption = '', min = null } = {}) {
  const W = 640, H = height, padL = 44, padR = 16, padT = 16, padB = 30;
  const vals = points.map((p) => p.value);
  let lo = min ?? Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const span = hi - lo; lo -= span * 0.15; hi += span * 0.15;
  const x = (i) => { const k = points.length === 1 ? 0.5 : i / (points.length - 1); const px = padL + k * (W - padL - padR); return rtl() ? W - px + padL - padR : px; };
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const ticks = [0, 0.5, 1].map((k) => lo + (hi - lo) * k);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const every = Math.ceil(points.length / 6);
  const el = svg(`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${caption}">
    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart)" stop-opacity="0.28"/><stop offset="1" stop-color="var(--chart)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((v) => `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}"/><text x="${rtl() ? W - 6 : 6}" y="${y(v) + 4}" text-anchor="${rtl() ? 'end' : 'start'}">${Math.round(v * 10) / 10}</text>`).join('')}
    <path class="area" d="${area}"/><path class="line" d="${d}"/>
    ${points.map((p, i) => (i % every === 0 || i === points.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${p.label}</text>` : '')).join('')}
  </svg>`);
  points.forEach((p, i) => {
    const g = svg(`<svg><g><circle cx="${x(i)}" cy="${y(p.value)}" r="14" fill="transparent"/><circle class="dot" cx="${x(i)}" cy="${y(p.value)}" r="4"/></g></svg>`).firstElementChild;
    bindTip(g, p.tip || `${p.label}: ${p.value}`);
    el.append(g);
  });
  return h('div', {}, el, table(points, caption));
}

export function barChart(points, { height = 220, caption = '', highlightLast = true } = {}) {
  const W = 640, H = height, padL = 34, padR = 10, padT = 14, padB = 30;
  const max = niceMax(Math.max(...points.map((p) => p.value), 1));
  const n = points.length, slot = (W - padL - padR) / n, bw = Math.min(46, slot - 2 - slot * 0.3);
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const xOf = (i) => { const c = padL + slot * (i + 0.5); return rtl() ? W - c : c; };
  const el = svg(`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${caption}">
    ${[0, 0.5, 1].map((k) => `<line class="grid-line" x1="${padL}" x2="${W - padR}" y1="${y(max * k)}" y2="${y(max * k)}"/><text x="${rtl() ? W - 4 : 4}" y="${y(max * k) + 4}" text-anchor="${rtl() ? 'end' : 'start'}">${Math.round(max * k)}</text>`).join('')}
    ${points.map((p, i) => `<text x="${xOf(i)}" y="${H - 8}" text-anchor="middle">${p.label}</text>`).join('')}
  </svg>`);
  points.forEach((p, i) => {
    const hgt = Math.max(p.value > 0 ? 3 : 0, H - padB - y(p.value));
    const cx = xOf(i);
    // rounded top (4px), flat on the baseline
    const r = Math.min(4, bw / 2, hgt);
    const x0 = cx - bw / 2, x1 = cx + bw / 2, yb = H - padB, yt = yb - hgt;
    const path = hgt > 0 ? `M${x0},${yb} L${x0},${yt + r} Q${x0},${yt} ${x0 + r},${yt} L${x1 - r},${yt} Q${x1},${yt} ${x1},${yt + r} L${x1},${yb} Z` : '';
    const g = svg(`<svg><g><rect x="${cx - slot / 2}" y="${padT}" width="${slot}" height="${H - padT - padB}" fill="transparent"/><path class="barr ${highlightLast && i !== n - 1 ? 'dim' : ''}" d="${path}"/></g></svg>`).firstElementChild;
    bindTip(g, p.tip || `${p.label}: ${p.value}`);
    el.append(g);
  });
  return h('div', {}, el, table(points, caption));
}

export function hbarChart(points, { caption = '', unit = '' } = {}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return h('div', { class: 'hbars', role: 'list', 'aria-label': caption },
    ...points.map((p) => {
      const fill = h('i');
      requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = (p.value / max) * 100 + '%')));
      const row = h('div', { class: 'hbar', role: 'listitem' },
        h('span', { class: 'lbl' }, p.label), h('div', { class: 'track' }, fill), h('b', {}, `${p.value}${unit}`));
      bindTip(row, p.tip || `${p.label}: ${p.value}${unit}`);
      return row;
    }));
}
