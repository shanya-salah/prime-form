// =========================================================
// spotify.js — official Spotify integration, frontend only.
//
// SECURITY: we use the "Authorization Code with PKCE" flow,
// which is made for browser apps. It needs ONLY the public
// Client ID. No Client Secret is used or stored anywhere.
// Tokens live in sessionStorage (cleared when the tab closes).
//
// LIMITS (Spotify rules, 2026):
//  • Development Mode apps: the app owner must have Premium,
//    max 5 users added in the dashboard.
//  • Playing music INSIDE the website (Web Playback SDK)
//    requires the listener to have Spotify Premium.
//  • Free users can still use the official embed player.
// =========================================================
import { store } from '../core/store.js';

const AUTH = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const SCOPES = ['streaming', 'user-read-email', 'user-read-private', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private'];
const TK = 'primeform:spotify';

// Verified official Spotify playlists for the no-login player
export const QUICK = {
  moderate: { id: '37i9dQZF1DX70RN3TfWWJh', search: 'workout' },
  high: { id: '37i9dQZF1DX76Wlfdnj7AP', search: 'beast mode workout' },
  warmup: { id: null, search: 'warm up workout' },
  cooldown: { id: null, search: 'cool down stretching' },
};

// ---------- state shared with the UI ----------
const listeners = new Set();
export const sp = { connected: false, user: null, deviceId: null, ready: false, track: null, paused: true, error: null, premium: null, volume: 0.6 };
const emit = () => listeners.forEach((l) => l(sp));
export const onSpotify = (fn) => { listeners.add(fn); fn(sp); return () => listeners.delete(fn); };

export const redirectUri = () => location.origin + location.pathname;
export const canUseAuth = () => window.isSecureContext && !/^http:\/\/localhost/.test(location.origin);

function tokens() { try { return JSON.parse(sessionStorage.getItem(TK)); } catch { return null; } }
function saveTokens(t) { sessionStorage.setItem(TK, JSON.stringify(t)); }

// ---------- PKCE helpers ----------
function randomString(n = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const a = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(a, (x) => chars[x % chars.length]).join('');
}
async function challenge(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Step 1: send the user to Spotify's login page. */
export async function login() {
  const clientId = store.get().spotify.clientId.trim();
  if (!clientId) throw new Error('needId');
  const verifier = randomString(64);
  const state = randomString(16);
  sessionStorage.setItem('primeform:pkce', JSON.stringify({ verifier, state }));
  const params = new URLSearchParams({
    response_type: 'code', client_id: clientId, scope: SCOPES.join(' '), redirect_uri: redirectUri(),
    code_challenge_method: 'S256', code_challenge: await challenge(verifier), state,
  });
  location.href = `${AUTH}?${params}`;
}

/** Step 2: Spotify sends the user back with ?code=… — exchange it for a token. */
export async function handleSpotifyRedirect() {
  const q = new URLSearchParams(location.search);
  if (!q.has('code') && !q.has('error')) { if (tokens()) connect().catch(() => {}); return; }
  const pk = JSON.parse(sessionStorage.getItem('primeform:pkce') || 'null');
  history.replaceState(null, '', location.pathname + '#/music');
  if (q.has('error')) { sp.error = q.get('error'); emit(); return; }
  if (!pk || q.get('state') !== pk.state) { sp.error = 'state mismatch'; emit(); return; }
  try {
    const res = await fetch(TOKEN, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: redirectUri(), client_id: store.get().spotify.clientId.trim(), code_verifier: pk.verifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || res.status);
    saveTokens({ access: data.access_token, refresh: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 });
    sessionStorage.removeItem('primeform:pkce');
    sp.justConnected = true;
    await connect();
  } catch (e) { sp.error = e.message; emit(); }
}

async function refresh() {
  const tk = tokens();
  if (!tk?.refresh) throw new Error('expired');
  const res = await fetch(TOKEN, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tk.refresh, client_id: store.get().spotify.clientId.trim() }),
  });
  const data = await res.json();
  if (!res.ok) { logout(); throw new Error('expired'); }
  saveTokens({ access: data.access_token, refresh: data.refresh_token || tk.refresh, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

async function accessToken() {
  const tk = tokens();
  if (!tk) throw new Error('expired');
  if (Date.now() > tk.expiresAt - 60000) return refresh();
  return tk.access;
}

/** Call the Web API. */
export async function api(path, opts = {}) {
  const go = async (token) => fetch(API + path, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  let res = await go(await accessToken());
  if (res.status === 401) res = await go(await refresh());
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}

async function connect() {
  const me = await api('/me');
  sp.connected = true; sp.user = me.display_name || me.id; sp.premium = me.product ? me.product === 'premium' : null; sp.error = null;
  emit();
  if (sp.premium !== false) loadPlayer();
}

export function logout() {
  sessionStorage.removeItem(TK);
  try { player?.disconnect(); } catch { /* ignore */ }
  player = null;
  Object.assign(sp, { connected: false, user: null, deviceId: null, ready: false, track: null, paused: true, premium: null });
  emit();
}

// ---------- Web Playback SDK (Premium) ----------
let player = null, sdkLoading = null;
function loadSdk() {
  if (window.Spotify) return Promise.resolve();
  if (sdkLoading) return sdkLoading;
  sdkLoading = new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = resolve;
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    s.onerror = () => reject(new Error('SDK download failed'));
    document.head.append(s);
  });
  return sdkLoading;
}

async function loadPlayer() {
  if (player) return;
  try { await loadSdk(); } catch (e) { sp.error = e.message; emit(); return; }
  player = new window.Spotify.Player({ name: 'PRIME FORM Gym', getOAuthToken: (cb) => accessToken().then(cb).catch(() => {}), volume: sp.volume });
  player.addListener('ready', ({ device_id }) => { sp.deviceId = device_id; sp.ready = true; emit(); });
  player.addListener('not_ready', () => { sp.ready = false; emit(); });
  player.addListener('player_state_changed', (s) => {
    if (!s) return;
    const tr = s.track_window.current_track;
    sp.track = tr ? { name: tr.name, artists: tr.artists.map((a) => a.name).join(', '), art: tr.album.images[0]?.url } : null;
    sp.paused = s.paused; emit();
  });
  player.addListener('account_error', () => { sp.premium = false; sp.ready = false; emit(); });
  player.addListener('authentication_error', ({ message }) => { sp.error = message; emit(); });
  player.addListener('initialization_error', ({ message }) => { sp.error = message; emit(); });
  player.connect();
}

export async function playUri(uri) {
  if (!sp.deviceId) throw new Error('no device');
  await api(`/me/player/play?device_id=${sp.deviceId}`, { method: 'PUT', body: JSON.stringify({ context_uri: uri }) });
}
export const togglePlay = () => player?.togglePlay();
export const nextTrack = () => player?.nextTrack();
export const prevTrack = () => player?.previousTrack();
export function setVolume(v) { sp.volume = v; player?.setVolume(v); }

/** Current playback on ANY device (works for free accounts too, read-only). */
export async function currentlyPlaying() {
  const d = await api('/me/player/currently-playing');
  if (!d?.item) return null;
  return { name: d.item.name, artists: (d.item.artists || []).map((a) => a.name).join(', '), art: d.item.album?.images?.[0]?.url, playing: d.is_playing };
}

export async function myPlaylists() { return (await api('/me/playlists?limit=12'))?.items?.filter(Boolean) || []; }
export async function searchPlaylists(q) { return (await api(`/search?type=playlist&limit=10&q=${encodeURIComponent(q)}`))?.playlists?.items?.filter(Boolean) || []; }

/** Turn a pasted Spotify link into an embed path, e.g. "playlist/37i9…". */
export function parseSpotifyLink(text) {
  const m = String(text).trim().match(/(?:open\.spotify\.com\/(?:intl-\w+\/)?|spotify:)(playlist|album|track|artist)[/:]([A-Za-z0-9]{10,})/);
  return m ? `${m[1]}/${m[2]}` : null;
}
