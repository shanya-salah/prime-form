// =========================================================
// router.js — simple "hash" router.
// URLs look like  index.html#/exercise/squat
// Hash routing works on any static server (no backend needed).
// =========================================================

const routes = [];
let current = null;      // { page, cleanup }
let guard = null;        // optional function that can block leaving a page
let lastHash = location.hash;
let onChangeCb = () => {};

export function addRoute(pattern, page) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ rx, keys, page });
}

export function navigate(path) {
  if (('#' + path) === location.hash) render(); else location.hash = path;
}

/** A page can block navigation (e.g. during an active workout). */
export function setGuard(fn) { guard = fn; }
export function onRouteChange(fn) { onChangeCb = fn; }
export function currentPath() { return (location.hash.slice(1) || '/').split('?')[0]; }

function parse() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { page: r.page, params, query, path };
    }
  }
  return { page: routes[0].page, params: {}, query, path: '/' };
}

export async function render() {
  const root = document.getElementById('app');
  const match = parse();
  if (current && current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
  guard = null;
  root.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  let cleanup;
  try {
    cleanup = await match.page.render(root, match.params, match.query);
  } catch (e) {
    console.error(e);
    root.innerHTML = `<div class="page"><div class="glass card"><h2>Something went wrong</h2><p class="muted">${String(e.message || e)}</p><p><a class="btn btn-ghost" href="#/">Home</a></p></div></div>`;
  }
  current = { page: match.page, cleanup };
  lastHash = location.hash;
  onChangeCb(match);
}

window.addEventListener('hashchange', async () => {
  if (guard) {
    const ok = await guard();
    if (!ok) { history.replaceState(null, '', lastHash || '#/'); return; }
  }
  render();
});
