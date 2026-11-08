// =========================================================
// pose.js — camera + MediaPipe Pose Landmarker.
//
// The model runs 100% in the browser (WebAssembly + GPU).
// Camera frames are NEVER uploaded. The only network use is
// downloading the library and model the first time
// (then the browser caches them).
// =========================================================

// Official Google MediaPipe Tasks Vision package (served by jsDelivr CDN)
const VISION_VERSION = '0.10.14';
const VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}`;
const WASM_URL = `${VISION_URL}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

let landmarker = null;
let loading = null;

export async function loadPoseModel() {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    // the ES-module build of the library; fall back to the package default if needed
    let vision;
    try { vision = await import(`${VISION_URL}/vision_bundle.mjs`); }
    catch { vision = await import(VISION_URL); }
    if (!vision.PoseLandmarker && vision.default) vision = vision.default;
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const make = (delegate) => vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO', numPoses: 1,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    try { landmarker = await make('GPU'); } catch { landmarker = await make('CPU'); }
    return landmarker;
  })();
  try { return await loading; } catch (e) { loading = null; throw e; }
}

/** Ask for the camera. Throws an Error with .code = 'insecure' | 'denied' | 'nocamera' | 'other' */
export async function startCamera(video) {
  if (!window.isSecureContext) { const e = new Error('insecure'); e.code = 'insecure'; throw e; }
  if (!navigator.mediaDevices?.getUserMedia) { const e = new Error('nocamera'); e.code = 'nocamera'; throw e; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
    });
    video.srcObject = stream;
    video.muted = true; video.playsInline = true;
    await video.play();
    await new Promise((r) => (video.readyState >= 2 ? r() : video.addEventListener('loadeddata', r, { once: true })));
    return stream;
  } catch (err) {
    const e = new Error(err.message);
    e.code = err.name === 'NotAllowedError' || err.name === 'SecurityError' ? 'denied' : err.name === 'NotFoundError' || err.name === 'OverconstrainedError' ? 'nocamera' : 'other';
    throw e;
  }
}

export function stopCamera(stream) { stream?.getTracks().forEach((tr) => tr.stop()); }

/** Run the detector on the current video frame. Returns 33 landmarks or null. */
export function detect(video, now) {
  if (!landmarker || video.readyState < 2) return null;
  const res = landmarker.detectForVideo(video, now);
  return res?.landmarks?.[0] || null;
}

// ---------- Skeleton drawing ----------
const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32],
];
const COLORS = { ok: '#22C55E', warn: '#F59E0B', bad: '#EF4444', idle: '#A0A7AE' };

/** Draw the skeleton. Joints in `bad` are drawn red and larger. */
export function drawSkeleton(ctx, lm, status = 'idle', bad = []) {
  const { width: w, height: hgt } = ctx.canvas;
  ctx.clearRect(0, 0, w, hgt);
  if (!lm) return;
  const col = COLORS[status] || COLORS.idle;
  const badSet = new Set(bad);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, w / 220);
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  for (const [a, b] of BONES) {
    const p = lm[a], q = lm[b];
    if ((p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
    ctx.strokeStyle = badSet.has(a) || badSet.has(b) ? COLORS.bad : col;
    ctx.beginPath(); ctx.moveTo(p.x * w, p.y * hgt); ctx.lineTo(q.x * w, q.y * hgt); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 11; i < 33; i++) {
    const p = lm[i];
    if ((p.visibility ?? 1) < 0.4) continue;
    const isBad = badSet.has(i);
    ctx.fillStyle = isBad ? COLORS.bad : '#fff';
    ctx.beginPath(); ctx.arc(p.x * w, p.y * hgt, isBad ? w / 90 : w / 180, 0, Math.PI * 2); ctx.fill();
    if (isBad) { ctx.strokeStyle = 'rgba(239,68,68,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x * w, p.y * hgt, w / 45, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = Math.max(3, w / 220); }
  }
  // head
  const nose = lm[0];
  if ((nose.visibility ?? 1) > 0.4) { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(nose.x * w, nose.y * hgt, w / 50, 0, Math.PI * 2); ctx.stroke(); }
}
