// =========================================================
// main.js — app start-up.
//  1. apply saved settings (language, theme, accessibility)
//  2. start the 3D gym background
//  3. build the navigation, register pages, start the router
// =========================================================
import { store } from './core/store.js';
import { applyLanguage, t } from './core/i18n.js';
import { addRoute, render, onRouteChange } from './core/router.js';
import { initScene, setShot, setSceneOptions } from './scene/gym3d.js';
import { detectPhotos, setPhotosEnabled, showPhoto } from './scene/photos.js';
import { renderNav, markActive, closeAll } from './components/nav.js';
import { initMusicDock } from './components/musicDock.js';
import { initQuickTools } from './components/quickTools.js';
import { maybeShowOnboarding } from './components/onboarding.js';
import { handleSpotifyRedirect } from './services/spotify.js';
import { toast } from './core/ui.js';

import home from './pages/home.js';
import library from './pages/library.js';
import category from './pages/category.js';
import exercise from './pages/exercise.js';
import setup from './pages/setup.js';
import workout from './pages/workout.js';
import summary from './pages/summary.js';
import history from './pages/history.js';
import progress from './pages/progress.js';
import profile from './pages/profile.js';
import settings from './pages/settings.js';
import music from './pages/music.js';
import favorites from './pages/favorites.js';
import { about, help, privacy } from './pages/info.js';

// ---------- Settings → HTML attributes ----------
function applySettings() {
  const s = store.get().settings;
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.dataset.accent = s.accent;
  root.dataset.largeText = String(s.largeText);
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.reduceMotion = String(s.reduceMotion);
  document.querySelector('meta[name="theme-color"]').content = s.theme === 'light' ? '#E9ECEF' : '#0B0D0F';
  setSceneOptions({ theme: s.theme, accent: s.accent, motion: !s.reduceMotion, on: s.background !== 'off' });
}

async function applyBackground() {
  const s = store.get().settings;
  if (s.background === 'photos') {
    const n = await detectPhotos();
    const on = setPhotosEnabled(n > 0);
    if (!on) toast(t('settings.bgMissing'), 'info', 5000);
    setSceneOptions({ on: !on });
    showPhoto(0);
  } else {
    setPhotosEnabled(false);
  }
}

// ---------- Routes ----------
addRoute('/', home);
addRoute('/library', library);
addRoute('/favorites', favorites);
addRoute('/category/:id', category);
addRoute('/exercise/:id', exercise);
addRoute('/setup', setup);
addRoute('/workout', workout);
addRoute('/summary/:id', summary);
addRoute('/history', history);
addRoute('/progress', progress);
addRoute('/profile', profile);
addRoute('/settings', settings);
addRoute('/music', music);
addRoute('/about', about);
addRoute('/help', help);
addRoute('/privacy', privacy);

onRouteChange((match) => {
  closeAll();
  markActive();
  const inner = match.path !== '/';
  document.body.classList.toggle('page-inner', inner);
  document.body.classList.toggle('page-workout', match.path === '/workout');
  if (match.page.shot) setShot(match.page.shot);
  if (inner) showPhoto(3);
  document.getElementById('site-header').classList.toggle('scrolled', inner && window.scrollY > 10);
});

// ---------- React to setting changes ----------
let lastLang = store.get().settings.lang;
let lastBg = store.get().settings.background;
store.subscribe((state, reason) => {
  applySettings();
  if (state.settings.lang !== lastLang || reason === 'reset' || reason === 'import') {
    lastLang = state.settings.lang;
    applyLanguage();
    renderNav();
    // re-draw the current page in the new language (but never interrupt a live workout)
    if (!document.body.classList.contains('page-workout')) render();
  } else if (reason === 'profile') {
    renderNav();
  }
  if (state.settings.background !== lastBg) { lastBg = state.settings.background; applyBackground(); }
});

window.addEventListener('scroll', () => {
  const inner = document.body.classList.contains('page-inner');
  document.getElementById('site-header').classList.toggle('scrolled', inner && window.scrollY > 10);
}, { passive: true });

// ---------- Start ----------
applySettings();
applyLanguage();
initScene(document.getElementById('gym-canvas'));
applyBackground();
renderNav();
initMusicDock();
initQuickTools();
handleSpotifyRedirect().finally(() => {
  render();
  maybeShowOnboarding();
});
