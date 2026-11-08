// =========================================================
// music.js — Spotify connection, player and workout playlists.
// =========================================================
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/i18n.js';
import { store } from '../core/store.js';
import { pageHead, toast, notice, segmented } from '../core/ui.js';
import {
  QUICK, sp, onSpotify, login, logout, redirectUri, canUseAuth, playUri, togglePlay, nextTrack, prevTrack, setVolume,
  myPlaylists, searchPlaylists, currentlyPlaying, parseSpotifyLink,
} from '../services/spotify.js';
import { playEmbed } from '../components/musicDock.js';

let intensity = 'moderate';

export default {
  shot: 'music',
  render(root) {
    const page = h('div', { class: 'page wide' });
    page.append(pageHead(t('music.title'), t('music.sub')));
    const left = h('div', { class: 'stack', style: { gap: '18px' } });
    const right = h('div', { class: 'stack', style: { gap: '18px' } });
    page.append(h('div', { class: 'music-layout' }, left, right));
    root.append(page);

    // ---------- connection card ----------
    const connCard = h('div', { class: 'glass card' });
    const nowCard = h('div', { class: 'glass card' });
    const listsCard = h('div', { class: 'glass card' });
    left.append(connCard, nowCard);
    right.append(quickCard(), listsCard);

    function drawConn() {
      connCard.innerHTML = '';
      connCard.append(h('div', { class: 'card-title' }, icon('music'), t('music.spotify')));
      if (sp.connected) {
        connCard.append(notice(t('music.connected', { name: sp.user }), 'ok', 'check'),
          sp.premium === false ? h('div', { style: { marginTop: '10px' } }, notice(t('music.notPremium'), 'warn', 'alert')) : null,
          sp.ready ? h('p', { class: 'hint', style: { marginTop: '10px' } }, t('music.ready')) : null,
          h('button', { class: 'btn btn-ghost sm', style: { marginTop: '14px' }, onclick: () => { logout(); } }, icon('logout', 'sm'), t('music.disconnect')));
        return;
      }
      const idIn = h('input', { class: 'input', value: store.get().spotify.clientId, placeholder: 'e.g. 3f9a…', spellcheck: 'false', autocomplete: 'off', dir: 'ltr', id: 'sp-id' });
      const copyBtn = h('button', { class: 'icon-btn', 'aria-label': t('common.copy') }, icon('copy', 'sm'));
      copyBtn.addEventListener('click', () => navigator.clipboard?.writeText(redirectUri()).then(() => toast(t('common.copied'), 'success')));
      const connectBtn = h('button', { class: 'btn btn-primary' }, icon('link', 'sm'), t('music.connect'));
      connectBtn.addEventListener('click', async () => {
        const v = idIn.value.trim();
        if (!/^[a-f0-9]{32}$/i.test(v)) { toast(t('music.needId'), 'error'); idIn.setAttribute('aria-invalid', 'true'); return; }
        store.update((s) => (s.spotify.clientId = v), 'spotify');
        if (!canUseAuth()) { toast(t('music.insecure'), 'error', 7000); return; }
        try { await login(); } catch (e) { toast(t('music.authErr', { msg: e.message }), 'error'); }
      });
      connCard.append(
        h('p', { class: 'muted small', style: { marginBottom: '14px' } }, t('music.premium')),
        h('div', { class: 'field' }, h('label', { for: 'sp-id' }, t('music.clientId')), idIn, h('div', { class: 'hint' }, t('music.clientHint'))),
        h('div', { class: 'field', style: { marginTop: '12px' } }, h('span', { class: 'label' }, t('music.redirect')), h('div', { class: 'code-row' }, h('code', {}, redirectUri()), copyBtn)),
        !canUseAuth() ? h('div', { style: { marginTop: '10px' } }, notice(t('music.insecure'), 'warn', 'alert')) : null,
        h('div', { style: { marginTop: '14px' } }, connectBtn),
        h('hr', { class: 'hr' }),
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, t('music.steps')),
        h('ol', { class: 'ol' }, ...t('music.stepList').map((s) => h('li', {}, h('span', {}, s)))),
        h('p', { class: 'hint', style: { marginTop: '12px' } }, t('music.free')));
      if (sp.error) connCard.append(h('div', { style: { marginTop: '10px' } }, notice(t('music.authErr', { msg: sp.error }), 'bad', 'alert')));
    }

    async function drawNow() {
      nowCard.innerHTML = '';
      nowCard.append(h('div', { class: 'card-title' }, icon('activity'), t('music.now')));
      let tr = sp.track;
      if (!tr && sp.connected) { try { tr = await currentlyPlaying(); } catch { /* not available */ } }
      const art = h('div', { class: 'art', style: { backgroundImage: tr?.art ? `url("${tr.art}")` : '' } }, tr?.art ? null : icon('music', 'lg'));
      nowCard.append(h('div', { class: 'now' }, art, h('div', { class: 'meta' }, h('b', {}, tr ? tr.name : t('music.nothing')), h('span', {}, tr ? tr.artists : ''))));
      if (sp.ready) {
        const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: sp.volume, 'aria-label': t('music.volume') });
        vol.addEventListener('input', () => setVolume(Number(vol.value)));
        nowCard.append(
          h('div', { class: 'player-ctl' },
            h('button', { class: 'icon-btn', 'aria-label': t('music.prev'), onclick: prevTrack }, icon('skipPrev')),
            h('button', { class: 'play', 'aria-label': t('music.play'), onclick: togglePlay }, icon(sp.paused ? 'play' : 'pause')),
            h('button', { class: 'icon-btn', 'aria-label': t('music.next'), onclick: nextTrack }, icon('skipNext'))),
          h('div', { class: 'vol' }, icon('volume', 'sm'), vol));
      } else {
        nowCard.append(h('p', { class: 'hint', style: { marginTop: '12px' } }, t('music.free')));
      }
    }

    async function drawLists() {
      listsCard.innerHTML = '';
      if (!sp.connected) { listsCard.classList.add('hidden'); return; }
      listsCard.classList.remove('hidden');
      const grid = (items) => h('div', { class: 'pl-grid' }, ...items.map((p) => {
        const b = h('button', { class: 'pl' },
          h('div', { class: 'cover', style: { backgroundImage: p.images?.[0]?.url ? `url("${p.images[0].url}")` : '' } }, p.images?.[0] ? null : icon('music')),
          h('b', {}, p.name), h('span', {}, p.owner?.display_name || ''));
        b.addEventListener('click', async () => {
          if (sp.ready) { try { await playUri(p.uri); toast(`${t('music.play')}: ${p.name}`, 'success'); } catch (e) { toast(t('music.sdkFail', { msg: e.message }), 'error'); playEmbed(`playlist/${p.id}`); } }
          else playEmbed(`playlist/${p.id}`);
        });
        return b;
      }));
      listsCard.append(h('div', { class: 'card-title' }, icon('search'), `${t('music.found')} — ${t('music.' + intensity)}`), h('div', { class: 'spinner' }));
      try {
        const [found, mine] = await Promise.all([searchPlaylists(QUICK[intensity].search), myPlaylists().catch(() => [])]);
        listsCard.lastChild.remove();
        listsCard.append(found.length ? grid(found) : h('p', { class: 'muted' }, t('music.none')));
        if (mine.length) listsCard.append(h('div', { class: 'card-title', style: { marginTop: '18px' } }, icon('list'), t('music.mine')), grid(mine));
      } catch (e) {
        listsCard.lastChild.remove();
        listsCard.append(notice(t('music.sdkFail', { msg: e.message }), 'bad', 'alert'));
      }
    }

    function quickCard() {
      const card = h('div', { class: 'glass card' });
      const body = h('div');
      const drawQuick = () => {
        body.innerHTML = '';
        const q = QUICK[intensity];
        if (q.id) {
          body.append(h('button', { class: 'btn btn-primary', onclick: () => playEmbed(`playlist/${q.id}`) }, icon('play', 'sm'), `${t('music.play')} — ${t('music.' + intensity)}`));
        } else {
          body.append(h('a', { class: 'btn btn-ghost', href: `https://open.spotify.com/search/${encodeURIComponent(q.search)}/playlists`, target: '_blank', rel: 'noopener' }, icon('search', 'sm'), `${t('music.openApp')} — ${t('music.' + intensity)}`));
        }
      };
      const pasteIn = h('input', { class: 'input', placeholder: t('music.pastePh'), dir: 'ltr', 'aria-label': t('music.paste') });
      const loadBtn = h('button', { class: 'btn btn-ghost' }, t('music.load'));
      loadBtn.addEventListener('click', () => { const p = parseSpotifyLink(pasteIn.value); if (!p) return toast(t('music.invalid'), 'error'); playEmbed(p); });
      card.append(h('div', { class: 'card-title' }, icon('zap'), t('music.intensity')),
        segmented(['warmup', 'moderate', 'high', 'cooldown'].map((k) => [k, t('music.' + k)]), intensity, (v) => { intensity = v; drawQuick(); drawLists(); }, t('music.intensity')),
        h('div', { class: 'eyebrow', style: { margin: '18px 0 10px' } }, t('music.quick')), body,
        h('div', { class: 'field', style: { marginTop: '18px' } }, h('span', { class: 'label' }, t('music.paste')), h('div', { class: 'row' }, h('div', { class: 'grow' }, pasteIn), loadBtn)));
      drawQuick();
      return card;
    }

    // redraw on Spotify changes; fetch playlists only when the connection itself changes
    let lastConn = null, lastTrack = undefined;
    const off = onSpotify(() => {
      if (sp.connected !== lastConn) { lastConn = sp.connected; drawConn(); drawLists(); }
      else drawConn();
      const tr = sp.track ? sp.track.name + sp.paused + sp.ready : null;
      if (tr !== lastTrack) { lastTrack = tr; drawNow(); }
      if (sp.justConnected) { sp.justConnected = false; toast(t('music.loginOk'), 'success'); }
    });
    return off;
  },
};
