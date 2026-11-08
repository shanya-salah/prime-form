// =========================================================
// musicDock.js — a small player that stays on screen while you
// change pages, so music keeps playing during the workout.
// Shows the Spotify embed (any account) or the in-site Web
// Playback SDK controls (Premium).
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/i18n.js';
import { onSpotify, togglePlay, nextTrack, prevTrack, sp } from '../services/spotify.js';

let embedPath = null, collapsed = false;

export function playEmbed(path) {
  embedPath = path; collapsed = false;
  draw();
}
export function closeEmbed() { embedPath = null; draw(); }

function draw() {
  const root = document.getElementById('music-dock');
  root.innerHTML = '';
  const sdkActive = sp.connected && sp.ready && sp.track;
  if (!embedPath && !sdkActive) return;

  const toggleBtn = h('button', { class: 'icon-btn', 'aria-label': collapsed ? t('music.show') : t('music.hide'), onclick: () => { collapsed = !collapsed; draw(); } }, icon(collapsed ? 'chevronDown' : 'minus', 'sm'));
  if (embedPath) {
    const frame = h('iframe', {
      src: `https://open.spotify.com/embed/${embedPath}?utm_source=generator&theme=0`, height: 152, loading: 'lazy', title: t('music.dock'),
      allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
    });
    root.append(h('div', { class: `dock ${collapsed ? 'collapsed' : ''}` },
      h('div', { class: 'dock-bar' }, icon('music', 'sm'), h('div', { class: 'meta' }, h('b', {}, t('music.dock')), h('span', {}, t('music.embedNote'))),
        h('a', { class: 'icon-btn', href: `https://open.spotify.com/${embedPath}`, target: '_blank', rel: 'noopener', 'aria-label': t('music.openApp') }, icon('link', 'sm')),
        toggleBtn,
        h('button', { class: 'icon-btn', 'aria-label': t('music.remove'), onclick: closeEmbed }, icon('x', 'sm'))),
      frame));
    return;
  }
  // Premium in-site player
  root.append(h('div', { class: 'dock' },
    h('div', { class: 'dock-bar' },
      h('div', { class: 'art', style: { backgroundImage: sp.track.art ? `url("${sp.track.art}")` : '' } }),
      h('div', { class: 'meta' }, h('b', {}, sp.track.name), h('span', {}, sp.track.artists)),
      h('button', { class: 'icon-btn', 'aria-label': t('music.prev'), onclick: prevTrack }, icon('skipPrev', 'sm')),
      h('button', { class: 'icon-btn', 'aria-label': sp.paused ? t('music.play') : t('exercise.pause'), onclick: togglePlay }, icon(sp.paused ? 'play' : 'pause', 'sm')),
      h('button', { class: 'icon-btn', 'aria-label': t('music.next'), onclick: nextTrack }, icon('skipNext', 'sm')))));
}

export function initMusicDock() { onSpotify(() => { if (!embedPath) draw(); }); }
