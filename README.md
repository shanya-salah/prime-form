# PRIME FORM — AI-Powered Smart Gym & Personal Trainer

A premium, multilingual (Kurdish Sorani · Arabic · English) fitness website with a 3D gym
background, an exercise library with animated demonstrations, a **real camera-based AI coach**
(pose detection, rep counting, posture feedback, voice), workout tracking with charts, and
Spotify integration.

Plain **HTML + CSS + JavaScript**. No build step, no `npm install`.

---

## 1. How to run it (step by step)

### What you need
| Software | Why | Where |
|---|---|---|
| **Visual Studio Code** | to open and edit the project | https://code.visualstudio.com |
| **Live Server** extension | a tiny local web server (camera + modules need one) | VS Code → Extensions (Ctrl+Shift+X) → search **Live Server** (by Ritwick Dey) → Install |
| **Google Chrome** or **Microsoft Edge** | best support for camera, AI model and voices | — |
| Internet (first time) | downloads the AI model and fonts, then the browser caches them | — |

> You do **not** need Node.js for this project.

### Start
1. Unzip the project folder `prime-form`.
2. In VS Code: **File → Open Folder…** → choose `prime-form`.
3. VS Code may suggest installing *Live Server* (from `.vscode/extensions.json`) — accept.
4. Right-click `index.html` → **Open with Live Server**
   (or click **Go Live** in the blue bar at the bottom right).
5. The site opens at **http://127.0.0.1:5500/index.html**.

**Why not just double-click `index.html`?** Browsers block JavaScript modules and the camera on
`file://` pages. Live Server serves the files over `http://127.0.0.1`, which the browser trusts.

### Allow the camera
1. Click **Start Workout**, choose an exercise and press **Start workout**.
2. The browser asks "Use your camera?" → **Allow**.
3. If you clicked *Block* by mistake: click the **camera / lock icon** in the address bar →
   Camera → **Allow** → reload the page.
4. Put the device 2–3 m away at hip height, with your whole body in the frame, and stand at the
   angle shown for the exercise (**side view** or **front view**).

---

## 2. Architecture (short)

```
index.html ─► js/main.js  (start-up: settings, 3D scene, navigation, router)
                 │
   ┌─────────────┼──────────────────────────────────────────────┐
 core/          pages/            components/        ai/            services/
 store.js       home, library,    nav (mega menu,    analyzers.js   stats.js
 i18n.js        category,         drawer, search)    (angles, reps, achievements.js
 router.js      exercise, setup,  demo.js (animated  form checks)   spotify.js (PKCE)
 ui.js          workout, summary, skeletons)         pose.js        sound.js
 dom.js         history, progress charts.js          (MediaPipe,    session.js
 icons.js       profile, settings musicDock.js       camera,
                music, info       quickTools.js      skeleton)
                                  onboarding.js      voice.js
 scene/gym3d.js  – custom canvas 3D renderer for the gym background
 data/           – exercises, programs, exercise text in 3 languages
 i18n/           – interface text in 3 languages (same keys)
```

* **Routing:** hash URLs (`#/exercise/squat`) — works on any static server.
* **Translations:** one key file per language (`js/i18n/*.js`) + exercise text per language
  (`js/data/text.*.js`). Switching language changes `<html lang dir>` and redraws the page —
  no duplicated pages. RTL is automatic for Sorani and Arabic (CSS logical properties).
* **Design:** taken from your video — full-screen 3D gym fly-through, condensed uppercase
  headlines, frosted-glass cards, stacked logo, champagne-gold pill buttons, dot pagination,
  side arrows, thumbnail strip, round gold quick-button. (Settings → Appearance switches to the
  lime palette from the written brief.)

## 3. Folder structure

```
prime-form/
├─ index.html
├─ README.md
├─ .vscode/            extensions.json, settings.json (Live Server on 127.0.0.1:5500)
├─ assets/             favicon.svg, hero/ (optional own photos)
├─ css/                base, layout, components, home, pages, workout
├─ js/
│  ├─ main.js
│  ├─ core/            dom, icons, store, i18n, router, ui
│  ├─ scene/           gym3d (3D background), photos
│  ├─ components/      nav, demo, cards, charts, musicDock, quickTools, onboarding
│  ├─ ai/              analyzers, pose, voice
│  ├─ services/        stats, achievements, spotify, sound, session
│  ├─ pages/           home, library, category, favorites, exercise, setup, workout,
│  │                   summary, history, progress, profile, settings, music, info
│  ├─ data/            exercises, programs, text.en / text.ar / text.ckb
│  └─ i18n/            en, ar, ckb
└─ tests/analyzer-test.html   (checks rep counting for all 36 exercises)
```

---

## 4. Feature status (honest)

### ✅ Fully implemented (works offline after first load)
* Home slides with 3D camera fly-through, scroll / swipe / keyboard / dots / arrows
* **Exercise Categories** mega menu (14 categories, each with an animated-figure icon)
* 36 exercises: target muscles, level, equipment, start position, steps, breathing, reps, sets,
  rest, common mistakes, safety, animated demonstration (start → movement → return, movement
  arrow, live joint angle, "show common mistake" mode, best camera angle)
* Library search, filters (category, level, equipment, favorites), favorites
* Workout setup form with validation (single exercise or Core / Pro / Elite program)
* Live workout: countdown, set/rep counter, hold timer, rest timer, pause/resume, stop with
  confirmation, duration limit, manual "+1 rep" mode, summary with confetti and badges
* Three complete languages with RTL/LTR switching
* History (list + calendar), progress charts, consistency heat-map, personal records,
  12 achievement badges, daily goal ring, personalised recommendations
* Settings: language, dark/light, accent, 3D background on/off/photos, sound, voice (on/off,
  voice choice, speed, what to speak), camera status/test, mirror, skeleton, workout defaults,
  kg/lb, accessibility (larger text, high contrast, reduce motion), data export/import/delete
* Onboarding, quick-tools button (rest timer + tip), loading, empty and error states

### 🤖 AI coach — real, runs in your browser
* **MediaPipe Pose Landmarker** (Google) finds 33 body points ~30 times per second.
* `js/ai/analyzers.js` computes joint angles, counts reps with thresholds, and runs form checks
  (back lean, knees past toes, hips sagging, elbows drifting, uneven arms, shrugging, depth,
  tempo…). Skeleton turns **green / amber / red**; the problem joint is circled red.
* Spoken coaching with the browser's SpeechSynthesis; text is always shown too.
* **Privacy:** video never leaves the device; nothing is recorded.
* `tests/analyzer-test.html` feeds generated motion into every analyser — open it with Live
  Server to show your examiners that rep counting works for all 36 exercises.

### 🔑 Needs your own credentials
* **Spotify login + in-site playback** (see section 5).

### 🌐 Needs internet / configuration
* First download of the AI model (~6 MB) and Google Fonts.
* Camera permission.

### ⚠️ Technical limitations
* One 2D camera cannot see depth. Feedback depends on angle, light and clothing; it cannot catch
  every mistake and is **not medical advice**. If joints are hidden, the app asks you to step
  back or turn sideways instead of guessing.
* Kurdish text-to-speech voices are rarely installed (Windows/Android/iOS usually have none).
  The app detects this and shows feedback as large text instead. Arabic and English voices are
  usually available.
* Data is saved per browser (see section 6).

---

## 5. Spotify setup

**Spotify's rules (2026):**
* Development-Mode apps need the **app owner to have Spotify Premium**, and only **up to 5 users**
  you add in the dashboard can log in.
* Playing music **inside the website** (Web Playback SDK) needs the listener to have **Premium**.
* **No Premium?** The *Quick playlists* use Spotify's official embedded player and work without
  any setup (30-second previews unless you are logged in to open.spotify.com in that browser).

**Steps**
1. Go to https://developer.spotify.com/dashboard and log in → **Create app**.
2. App name/description: anything. Tick **Web API** and **Web Playback SDK**.
3. **Redirect URI:** copy the exact value shown on the site's **Music** page, normally
   `http://127.0.0.1:5500/index.html` → Add → Save.
   *(Spotify does not accept `localhost` — use `127.0.0.1`.)*
4. **Settings → User Management:** add the e-mail of every Spotify account that will log in.
5. Copy the **Client ID** (32 characters). Paste it on the Music page → **Connect Spotify**.

**Security:** the app uses the *Authorization Code with PKCE* flow, made for browser apps.
It needs only the public Client ID. **Never put the Client Secret in this project** — it isn't
needed. Tokens are kept in `sessionStorage` and disappear when the tab closes.

---

## 6. How data storage works

Everything (profile, settings, workouts, weights, favorites, badges) is saved in the browser's
**localStorage** under the key `primeform:v1`.

* ✅ Survives page refresh, closing the browser and restarting the computer.
* ❌ Deleted if you clear browsing data, and not shared between browsers or devices.
* Private/incognito windows forget it when closed.
* **Backup:** Settings → Your data → *Export backup* (a `.json` file) and *Import backup*.

There is no server or database, so there is no login and no cloud sync. That keeps the project
simple and private. A backend (for example Firebase or Supabase) would be the next step for
accounts across devices.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Blank page | Open with **Live Server**, not by double-clicking. Press F12 → Console to see errors. |
| "Camera only works on http://localhost…" | You opened `file://…`. Use Live Server. |
| Camera blocked | Address-bar camera/lock icon → Allow → reload. Close Zoom/Teams/other camera apps. |
| "AI model could not be loaded" | Check internet (first time). University networks sometimes block `cdn.jsdelivr.net` or `storage.googleapis.com` — try a phone hotspot. You can always continue in manual mode. |
| Reps not counted | Whole body visible, correct angle (side/front), full movement, good light. Use "+1 rep" if needed. |
| Skeleton jumps around | Better light, plain background, fitted clothes, stand 2–3 m away. |
| No voice | Settings → Voice → Test. If "no voice for this language", install a voice in Windows/phone settings, or use English/Arabic. |
| Spotify "INVALID_CLIENT: Invalid redirect URI" | The Redirect URI in the dashboard must match the one on the Music page **exactly** (127.0.0.1, port 5500, `/index.html`). |
| Spotify 403 / "user not registered" | Add the account e-mail in the dashboard → User Management. |
| Music stops inside site | Web player needs Premium; use the quick playlists (embed) instead. |
| 3D background slow on an old laptop | Settings → Appearance → 3D background → **Off**, or enable *Reduce motion*. |
| Fonts look plain | Fonts load from Google Fonts — needs internet. The site still works with system fonts. |
| Port 5500 busy | Live Server picks another port. Update the Spotify Redirect URI to match. |

---

## 8. Customising

* **Colours:** `css/base.css` → `:root` variables (`--accent`, `--bg`, …).
* **Add an exercise:** add an entry to `js/data/exercises.js` (pick an existing `demo` and `ai`
  type), then add its text with the same id to `text.en.js`, `text.ar.js` and `text.ckb.js`.
* **Change text:** edit `js/i18n/en.js` / `ar.js` / `ckb.js` (keep the keys identical).
* **Own gym photos:** see `assets/hero/README.txt`.

## Credits
MediaPipe Tasks Vision © Google (Apache 2.0) · Spotify Web API / Web Playback SDK / Embed ©
Spotify · Fonts: Anton, Inter, Noto Kufi Arabic, Noto Sans Arabic (Google Fonts, OFL).
Everything else — 3D scene, animations, icons, analysers — was written for this project.
