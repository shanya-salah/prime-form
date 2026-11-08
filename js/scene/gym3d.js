// =========================================================
// gym3d.js — the 3D gym background (inspired by the video).
//
// A tiny 3D engine written for this project (no library):
//   1. We build a gym out of flat polygons (floor, walls,
//      squat racks, benches, dumbbells, treadmills, lights).
//   2. Lighting is "baked" once (brighter under ceiling lights).
//   3. Every frame we move a virtual camera, project the
//      polygons onto the canvas and paint far-to-near.
// Each page / slide asks for a camera "shot", and the camera
// glides there — that is the fly-through effect in the video.
//
// Units: 100 = 1 metre. y is up. The room spans
//   x: -900 … 900, z: 0 … -3600 (entrance at z = 0), height 420.
// =========================================================

const ROOM = { w: 1800, d: 3600, h: 420 };
const NEAR = 6;

// ---------- Camera shots (x, y, z, yaw, pitch, fov) ----------
// yaw: 0 = looking into the room, + turns right. pitch: + looks down.
export const SHOTS = {
  hero:      { x: 40,    y: 185,  z: 260,   yaw: 0.0,   pitch: 0.035, fov: 64 },
  neon:      { x: 150,   y: 205,  z: -1500, yaw: -1.55, pitch: -0.03, fov: 60 },
  zone:      { x: -210,  y: 175,  z: -640,  yaw: 0.46,  pitch: 0.06,  fov: 58 },
  programs:  { x: -200,  y: 200,  z: -2050, yaw: 0.97,  pitch: 0.04,  fov: 62 },
  overhead:  { x: 0,     y: 2650, z: -60,   yaw: 0.0,   pitch: 1.02,  fov: 56 },
  orbit:     { x: -1350, y: 2150, z: -420,  yaw: 0.62,  pitch: 0.86,  fov: 56 },
  library:   { x: 230,   y: 175,  z: -260,  yaw: 0.78,  pitch: 0.05,  fov: 62 },
  category:  { x: -120,  y: 160,  z: -300,  yaw: -0.55, pitch: 0.04,  fov: 60 },
  exercise:  { x: -260,  y: 165,  z: -1080, yaw: -0.95, pitch: 0.08,  fov: 58 },
  setup:     { x: 60,    y: 150,  z: -820,  yaw: 0.25,  pitch: 0.02,  fov: 60 },
  workout:   { x: 0,     y: 170,  z: -1650, yaw: 0.0,   pitch: 0.0,   fov: 60 },
  progress:  { x: 600,   y: 2300, z: -300,  yaw: -0.4,  pitch: 0.95,  fov: 56 },
  history:   { x: 0,     y: 230,  z: -2300, yaw: 0.0,   pitch: -0.02, fov: 60 },
  settings:  { x: 420,   y: 190,  z: -2150, yaw: -2.5,  pitch: 0.02,  fov: 62 },
  music:     { x: 120,   y: 210,  z: -1500, yaw: -1.25, pitch: -0.04, fov: 58 },
  info:      { x: -500,  y: 190,  z: -2700, yaw: 0.6,   pitch: 0.03,  fov: 62 },
};

// ---------- Colour palettes (dark + light theme) ----------
const PALETTES = {
  dark: {
    fog: [9, 10, 12], floor: [23, 24, 27], wood: [132, 99, 68], wall: [55, 57, 60], back: [36, 38, 41],
    ceil: [21, 22, 24], steel: [34, 36, 39], chrome: [176, 178, 182], plate: [19, 19, 21], pad: [24, 24, 26],
    treadmill: [38, 40, 44], pillar: [78, 80, 83], cap: [16, 17, 19], light: [255, 246, 228], window: [196, 212, 228],
    ambient: 0.2, sky: 0.08,
  },
  light: {
    fog: [226, 229, 233], floor: [118, 121, 126], wood: [196, 160, 118], wall: [196, 197, 199], back: [176, 178, 181],
    ceil: [210, 211, 213], steel: [70, 73, 78], chrome: [205, 207, 210], plate: [52, 53, 56], pad: [58, 58, 62],
    treadmill: [96, 99, 104], pillar: [206, 207, 209], cap: [150, 152, 155], light: [255, 252, 240], window: [235, 243, 250],
    ambient: 0.62, sky: 0.12,
  },
};

// ---------- State ----------
let canvas, ctx, W = 0, H = 0, dpr = 1;
let pal = PALETTES.dark;
let accentRGB = [233, 210, 156];
let shell = [];   // floor, walls, ceiling (never overlap from inside → no sorting needed)
let objs = [];    // everything else (sorted far → near every frame)
let lights = [];  // emissive strips (also mirrored on the floor as reflections)
let pointLights = [];
let cam = { ...SHOTS.hero };
let tween = null;
let parallax = { x: 0, y: 0, tx: 0, ty: 0 };
let idleDrift = true;
let running = false;
let enabled = true;
let needsFrame = true;
let lastT = 0;

// =========================================================
// Geometry builders
// =========================================================
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/** A polygon. Points must be listed counter-clockwise when seen from the front. */
function poly(list, pts, color, opt = {}) {
  const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
  const c = [0, 0, 0];
  pts.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
  c[0] /= pts.length; c[1] /= pts.length; c[2] /= pts.length;
  const p = { pts, color, n, c, e: opt.e || 0, cull: opt.cull !== false, tex: opt.tex || null, glow: opt.glow || 0, alpha: opt.alpha ?? 1, stroke: opt.stroke || false };
  list.push(p);
  return p;
}

/** Axis-aligned box. (x, z) is the centre of the base, y is the bottom. */
function box(list, x, y, z, w, hgt, d, color, opt = {}) {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y, y1 = y + hgt, z0 = z - d / 2, z1 = z + d / 2;
  const top = opt.top || color;
  const faces = [
    [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top],    // top (+y)
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color],  // front (+z)
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], color],  // back (-z)
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], color],  // right (+x)
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color],  // left (-x)
  ];
  if (opt.bottom) faces.push([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], color]);
  faces.forEach((f) => poly(list, f.slice(0, 4), f[4], opt));
}

/** Cylinder (weight plate / bar) along the x or z axis. */
function cylinder(list, cx, cy, cz, r, len, axis, color, seg = 10, opt = {}) {
  const ring = (off) => {
    const pts = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const u = Math.cos(a) * r, v = Math.sin(a) * r;
      pts.push(axis === 'x' ? [cx + off, cy + v, cz + u] : [cx + u, cy + v, cz + off]);
    }
    return pts;
  };
  const A = ring(-len / 2), B = ring(len / 2);
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    if (axis === 'x') poly(list, [A[j], A[i], B[i], B[j]], color, opt);
    else poly(list, [A[i], A[j], B[j], B[i]], color, opt);
  }
  if (axis === 'x') { poly(list, [...B].reverse(), color, opt); poly(list, [...A], color, opt); }
  else { poly(list, [...B], color, opt); poly(list, [...A].reverse(), color, opt); }
}

/** A flat textured panel (signs and logos) facing a direction. */
function panel(list, center, width, height, facing, texture, opt = {}) {
  const [x, y, z] = center, hw = width / 2, hh = height / 2;
  let pts;
  if (facing === '+x') pts = [[x, y - hh, z + hw], [x, y - hh, z - hw], [x, y + hh, z - hw], [x, y + hh, z + hw]];
  else if (facing === '-x') pts = [[x, y - hh, z - hw], [x, y - hh, z + hw], [x, y + hh, z + hw], [x, y + hh, z - hw]];
  else pts = [[x - hw, y - hh, z], [x + hw, y - hh, z], [x + hw, y + hh, z], [x - hw, y + hh, z]]; // +z
  return poly(list, pts, [0, 0, 0], { ...opt, tex: texture });
}

// ---------- Text textures (neon sign + wall logo) ----------
function textTexture(lines, { font, color, glow, w = 1024, h = 512, neon = false }) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lh = h / (lines.length + 0.4);
  lines.forEach((line, i) => {
    const y = lh * (i + 0.7);
    g.font = line.font || font;
    // shrink horizontally if the text is wider than the texture
    const k = Math.min(1, (w * 0.9) / g.measureText(line.text).width);
    g.setTransform(k, 0, 0, 1, w / 2, y);
    if (neon) {
      g.shadowColor = glow; g.shadowBlur = 40; g.strokeStyle = glow; g.lineWidth = 10;
      g.strokeText(line.text, 0, 0);
      g.shadowBlur = 18; g.lineWidth = 5; g.strokeStyle = '#fff';
      g.strokeText(line.text, 0, 0);
    } else {
      g.shadowColor = glow; g.shadowBlur = 24; g.fillStyle = color;
      g.fillText(line.text, 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
  return c;
}

// =========================================================
// Build the gym
// =========================================================
function build() {
  shell = []; objs = []; lights = []; pointLights = [];
  const P = pal;
  const { w, d, h } = ROOM;
  const X0 = -w / 2, X1 = w / 2, Z0 = 0, Z1 = -d;

  // ---- Floor: rubber tiles with slight colour variation ----
  const T = 75;
  for (let x = X0; x < X1; x += T) {
    for (let z = Z0; z > Z1; z -= T) {
      const tile = (Math.floor((x - X0) / 150) + Math.floor((Z0 - z) / 150)) % 2;
      const v = tile ? 2 : -1;
      const c = [P.floor[0] + v, P.floor[1] + v, P.floor[2] + v];
      poly(shell, [[x, 0, z], [x + T, 0, z], [x + T, 0, z - T], [x, 0, z - T]], c, { stroke: true });
    }
  }

  // ---- Walls (tiled so lighting can make soft gradients) ----
  const WT = 150, HT = 105;
  for (let z = Z0; z > Z1; z -= WT) {
    for (let y = 0; y < h; y += HT) {
      // left wall (faces +x), right wall (faces -x)
      const seam = Math.floor((Z0 - z) / 300) % 2 ? 4 : 0;
      const cl = [P.wall[0] + seam, P.wall[1] + seam, P.wall[2] + seam];
      poly(shell, [[X0, y, z], [X0, y, z - WT], [X0, y + HT, z - WT], [X0, y + HT, z]], cl, { stroke: true });
      poly(shell, [[X1, y, z - WT], [X1, y, z], [X1, y + HT, z], [X1, y + HT, z - WT]], cl, { stroke: true });
    }
  }
  for (let x = X0; x < X1; x += WT) {
    for (let y = 0; y < h; y += HT) {
      poly(shell, [[x, y, Z1], [x + WT, y, Z1], [x + WT, y + HT, Z1], [x, y + HT, Z1]], P.back, { stroke: true });
    }
  }
  // front wall (faces into the room; invisible from outside thanks to back-face culling)
  for (let x = X0; x < X1; x += WT) {
    for (let y = 0; y < h; y += HT) {
      const glass = Math.abs(x + WT / 2) < 300 && y < 300;
      poly(shell, [[x + WT, y, Z0], [x, y, Z0], [x, y + HT, Z0], [x + WT, y + HT, Z0]], glass ? [18, 22, 27] : P.back, { stroke: true });
    }
  }
  // ---- Ceiling (faces down) ----
  for (let x = X0; x < X1; x += WT) {
    for (let z = Z0; z > Z1; z -= WT) {
      poly(shell, [[x, h, z - WT], [x + WT, h, z - WT], [x + WT, h, z], [x, h, z]], P.ceil, { stroke: true });
    }
  }
  // wall top caps (seen in the overhead "dollhouse" shots)
  box(objs, X0 - 12, h, (Z0 + Z1) / 2, 24, 6, d, P.cap);
  box(objs, X1 + 12, h, (Z0 + Z1) / 2, 24, 6, d, P.cap);
  box(objs, 0, h, Z1 - 12, w + 48, 6, 24, P.cap);

  // ---- Ceiling LED strips (long lines + rectangular frames, as in the video) ----
  const strip = (x0, z0, x1, z1) => {
    const t = 7, y = h - 2;
    let pts;
    if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) pts = [[x0, y, z0 - t], [x1, y, z0 - t], [x1, y, z0 + t], [x0, y, z0 + t]];
    else pts = [[x0 - t, y, z1], [x0 + t, y, z1], [x0 + t, y, z0], [x0 - t, y, z0]];
    lights.push(poly(objs, pts, P.light, { e: 1, glow: 1 }));
  };
  for (const lx of [-560, 560]) {
    for (let z = -150; z > -3450; z -= 560) strip(lx, z, lx, z - 440);
  }
  const frame = (cx, cz, fw, fd) => {
    strip(cx - fw / 2, cz + fd / 2, cx + fw / 2, cz + fd / 2);
    strip(cx - fw / 2, cz - fd / 2, cx + fw / 2, cz - fd / 2);
    strip(cx - fw / 2, cz + fd / 2, cx - fw / 2, cz - fd / 2);
    strip(cx + fw / 2, cz + fd / 2, cx + fw / 2, cz - fd / 2);
  };
  frame(0, -700, 520, 420);
  frame(0, -1500, 620, 520);
  frame(0, -2400, 520, 420);
  frame(0, -3150, 420, 300);
  // point lights used to bake brightness
  for (const lx of [-560, 560]) for (let z = -370; z > -3450; z -= 560) pointLights.push({ x: lx, y: h - 10, z, i: 0.95 });
  for (const [cz, s] of [[-700, 1], [-1500, 1.2], [-2400, 1], [-3150, 0.8]]) {
    pointLights.push({ x: -200, y: h - 10, z: cz, i: 0.7 * s }, { x: 200, y: h - 10, z: cz, i: 0.7 * s });
  }

  // ---- Windows on the right wall (bright daylight panels) ----
  for (let z = -1700; z > -3450; z -= 230) {
    lights.push(poly(objs, [[X1 - 2, 70, z - 200], [X1 - 2, 70, z], [X1 - 2, 360, z], [X1 - 2, 360, z - 200]], P.window, { e: 0.86, glow: 0.5 }));
  }
  pointLights.push({ x: X1 - 120, y: 220, z: -2100, i: 0.55 }, { x: X1 - 120, y: 220, z: -2800, i: 0.55 }, { x: X1 - 120, y: 220, z: -3300, i: 0.5 });

  // ---- Wood slat wall behind the squat racks ----
  for (let z = -500; z > -2500; z -= 40) {
    if (z < -1600 && z > -2200) continue; // gap for the neon sign
    const v = (Math.abs(z) / 40) % 3 === 0 ? 10 : 0;
    poly(objs, [[X0 + 3, 0, z], [X0 + 3, 0, z - 30], [X0 + 3, 300, z - 30], [X0 + 3, 300, z]], [P.wood[0] - 30 + v, P.wood[1] - 26 + v, P.wood[2] - 20 + v]);
  }

  // ---- Lifting platforms (wood) ----
  const platform = (x, z, pw, pd) => {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const v = i % 2 ? 8 : -6;
      const px = x - pw / 2 + (pw / n) * i;
      box(objs, px + pw / n / 2, 0, z, pw / n - 1, 4, pd, [P.wood[0] + v, P.wood[1] + v, P.wood[2] + v]);
    }
  };

  // ---- Squat racks with loaded barbells (left side) ----
  const rack = (x, z) => {
    platform(x + 30, z, 260, 300);
    const up = (ux, uz) => box(objs, ux, 4, uz, 10, 232, 10, P.steel);
    up(x - 60, z - 75); up(x - 60, z + 75); up(x + 60, z - 75); up(x + 60, z + 75);
    box(objs, x, 230, z - 75, 130, 8, 10, P.steel); box(objs, x, 230, z + 75, 130, 8, 10, P.steel);
    box(objs, x - 60, 230, z, 10, 8, 160, P.steel); box(objs, x + 60, 230, z, 10, 8, 160, P.steel);
    box(objs, x + 66, 132, z - 75, 10, 6, 8, P.chrome); box(objs, x + 66, 132, z + 75, 10, 6, 8, P.chrome);
    cylinder(objs, x + 70, 142, z, 2.5, 220, 'z', P.chrome, 6);
    for (const s of [-1, 1]) {
      cylinder(objs, x + 70, 142, z + s * 92, 22, 6, 'z', P.plate, 12);
      cylinder(objs, x + 70, 142, z + s * 100, 17, 5, 'z', [P.plate[0] + 10, P.plate[1] + 10, P.plate[2] + 12], 12);
    }
  };
  rack(-620, -820); rack(-620, -1520); rack(-620, -2220);

  // ---- Functional trainer (the "performance zone" machine) ----
  {
    const x = 210, z = -1360;
    platform(x, z, 420, 520);
    for (const s of [-1, 1]) {
      box(objs, x, 4, z + s * 115, 34, 244, 34, P.steel);
      box(objs, x, 4, z + s * 115, 22, 150, 22, [P.steel[0] + 12, P.steel[1] + 12, P.steel[2] + 12]); // weight stack
      box(objs, x + 22, 210, z + s * 115, 14, 14, 14, P.chrome);
    }
    box(objs, x, 248, z, 34, 12, 264, P.steel);
    box(objs, x - 30, 4, z, 60, 10, 260, P.steel);
    cylinder(objs, x + 30, 205, z, 2.5, 200, 'z', P.chrome, 6);
  }

  // ---- Benches ----
  const bench = (x, z, alongZ = true) => {
    if (alongZ) { box(objs, x, 38, z, 30, 9, 120, P.pad); box(objs, x, 0, z - 45, 26, 38, 8, P.steel); box(objs, x, 0, z + 45, 26, 38, 8, P.steel); }
    else { box(objs, x, 38, z, 120, 9, 30, P.pad); box(objs, x - 45, 0, z, 8, 38, 26, P.steel); box(objs, x + 45, 0, z, 8, 38, 26, P.steel); }
  };
  bench(-380, -820); bench(-380, -1520, false); bench(-160, -2250); bench(380, -560, false);

  // ---- Dumbbell rack along the right wall ----
  {
    const x = 790, z0 = -420, len = 880;
    box(objs, x, 0, z0 - len / 2, 70, 34, len, P.steel);
    box(objs, x + 10, 34, z0 - len / 2, 50, 30, len, P.steel);
    for (let i = 0; i < 16; i++) {
      const z = z0 - 30 - i * 54, s = 7 + (i % 8) * 0.9;
      // lower tier
      box(objs, x - 40, 34, z, 28, 2 * s, 2 * s, P.plate); box(objs, x - 4, 34, z, 28, 2 * s, 2 * s, P.plate);
      box(objs, x - 22, 34 + s - 1.5, z, 10, 3, 3, P.chrome);
      // upper tier
      if (i % 2 === 0) { box(objs, x - 6, 64, z, 22, 2 * s, 2 * s, P.plate); box(objs, x + 24, 64, z, 22, 2 * s, 2 * s, P.plate); }
    }
  }

  // ---- Treadmills facing the windows ----
  for (const z of [-2100, -2420, -2740, -3060]) {
    const x = 610;
    box(objs, x, 0, z, 180, 18, 72, P.treadmill);
    box(objs, x - 8, 18, z, 150, 3, 50, [P.treadmill[0] - 16, P.treadmill[1] - 16, P.treadmill[2] - 16]);
    box(objs, x + 84, 0, z - 32, 8, 125, 8, P.treadmill); box(objs, x + 84, 0, z + 32, 8, 125, 8, P.treadmill);
    box(objs, x + 84, 120, z, 22, 26, 76, [P.treadmill[0] - 12, P.treadmill[1] - 12, P.treadmill[2] - 10]);
    poly(objs, [[x + 72, 124, z - 22], [x + 72, 124, z + 22], [x + 72, 142, z + 22], [x + 72, 142, z - 22]], [80, 160, 255], { e: 0.6 });
  }

  // ---- Concrete pillars ----
  for (const [px, pz] of [[-430, -1950], [430, -1950], [-430, -2950], [430, -2950]]) box(objs, px, 0, pz, 60, h, 60, P.pillar);

  // ---- Logo on the back wall + neon sign on the left wall ----
  const acc = `rgb(${accentRGB.join(',')})`;
  const logoTex = textTexture([{ text: 'PRIME FORM' }], { font: '700 210px Anton, Impact, sans-serif', color: '#f1f1f1', glow: 'rgba(255,255,255,0.35)', h: 300 });
  panel(objs, [0, 270, Z1 + 2], 900, 260, '+z', logoTex, { alpha: pal === PALETTES.light ? 0.55 : 0.82 });
  const neonTex = textTexture([{ text: 'TRAIN WITH' }, { text: 'PURPOSE' }], { font: '700 150px Anton, Impact, sans-serif', glow: acc, neon: true, h: 420 });
  panel(objs, [X0 + 14, 318, -1900], 520, 210, '+x', neonTex, { glow: 1 });
  lights.push(poly(objs, [[-450, 150, Z1 + 3], [450, 150, Z1 + 3], [450, 156, Z1 + 3], [-450, 156, Z1 + 3]], accentRGB, { e: 1, glow: 1 }));

  bake();
}

/** Pre-compute the lit colour of every polygon. */
function bake() {
  const P = pal;
  const lit = (p) => {
    if (p.tex) return;
    if (p.e) { p.lit = p.color.map((v, i) => v * p.e + (P.light[i] * 0.2) * (1 - p.e)); return; }
    let b = P.ambient + P.sky * (p.n[1] * 0.5 + 0.5);
    for (const L of pointLights) {
      const dx = L.x - p.c[0], dy = L.y - p.c[1], dz = L.z - p.c[2];
      const dist = Math.hypot(dx, dy, dz) || 1;
      const ndl = (p.n[0] * dx + p.n[1] * dy + p.n[2] * dz) / dist;
      if (ndl > 0) b += 1.45 * L.i * ndl / (1 + (dist / 310) ** 2);
    }
    b = Math.min(b, 1.9);
    p.lit = p.color.map((v) => Math.min(255, v * b));
  };
  shell.forEach(lit); objs.forEach(lit);
}

// =========================================================
// Rendering
// =========================================================
function toCam(p, c, cy, sy, cp, sp) {
  const dx = p[0] - c.x, dy = p[1] - c.y, dz = p[2] - c.z;
  const xr = dx * cy + dz * sy;
  const zf = dx * sy - dz * cy;
  return [xr, zf * sp + dy * cp, zf * cp - dy * sp];
}

function clipNear(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a[2] >= NEAR, bin = b[2] >= NEAR;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (NEAR - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
    }
  }
  return out;
}

function drawFrame() {
  if (!ctx || !W) return;
  const c = {
    x: cam.x, y: cam.y, z: cam.z,
    yaw: cam.yaw + parallax.x * 0.035,
    pitch: cam.pitch + parallax.y * 0.02,
  };
  const t = performance.now() / 1000;
  if (idleDrift && !tween) { c.yaw += Math.sin(t * 0.21) * 0.012; c.x += Math.sin(t * 0.13) * 14; c.y += Math.sin(t * 0.17) * 5; }
  const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
  const F = (H / 2) / Math.tan(((cam.fov || 60) * Math.PI) / 360);
  const fog = pal.fog;
  const above = c.y > ROOM.h;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = `rgb(${fog.join(',')})`;
  ctx.fillRect(0, 0, W, H);

  const project = (p) => {
    const v = [];
    for (const pt of p.pts) v.push(toCam(pt, c, cy, sy, cp, sp));
    let vis = v;
    if (v.some((q) => q[2] < NEAR)) { vis = clipNear(v); if (vis.length < 3) return null; }
    let depth = 0;
    const scr = vis.map((q) => { depth += q[2]; return [W / 2 + (q[0] * F) / q[2], H / 2 - (q[1] * F) / q[2]]; });
    return { scr, depth: depth / vis.length };
  };
  const visible = (p) => !p.cull || (p.n[0] * (c.x - p.c[0]) + p.n[1] * (c.y - p.c[1]) + p.n[2] * (c.z - p.c[2])) > 0;
  const fogMix = (rgb, depth, extra = 0) => {
    const f = Math.min(0.82, Math.max(0, (depth - 500) / 5200) + extra);
    return `rgb(${(rgb[0] + (fog[0] - rgb[0]) * f) | 0},${(rgb[1] + (fog[1] - rgb[1]) * f) | 0},${(rgb[2] + (fog[2] - rgb[2]) * f) | 0})`;
  };
  const path = (scr) => { ctx.beginPath(); ctx.moveTo(scr[0][0], scr[0][1]); for (let i = 1; i < scr.length; i++) ctx.lineTo(scr[i][0], scr[i][1]); ctx.closePath(); };

  // 1) room shell
  ctx.lineWidth = 1;
  for (const p of shell) {
    if (!visible(p)) continue;
    const pr = project(p); if (!pr) continue;
    const col = fogMix(p.lit, pr.depth);
    path(pr.scr); ctx.fillStyle = col; ctx.fill();
    if (p.stroke) { ctx.strokeStyle = col; ctx.stroke(); }
  }

  // 2) glossy floor: mirror the lights under the floor (cheap reflection)
  if (!above) {
    ctx.globalAlpha = pal === PALETTES.light ? 0.05 : 0.075;
    for (const L of lights) {
      const mirror = { ...L, pts: L.pts.map((q) => [q[0], -q[1], q[2]]), cull: false };
      const pr = project(mirror); if (!pr) continue;
      path(pr.scr); ctx.fillStyle = fogMix(L.lit, pr.depth); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 3) objects, sorted far → near
  const list = [];
  for (const p of objs) {
    if (above && p.e && p.pts[0][1] > ROOM.h - 10) continue; // hide ceiling lights from above
    if (!visible(p)) continue;
    const pr = project(p); if (!pr) continue;
    list.push([p.tex ? pr.depth - 90 : pr.depth, p, pr.scr]);
  }
  list.sort((a, b) => b[0] - a[0]);
  for (const [depth, p, scr] of list) {
    if (p.tex) { drawTexture(p, scr); continue; }
    path(scr);
    ctx.fillStyle = fogMix(p.lit, depth, p.e ? -0.3 : 0);
    if (p.glow) {
      ctx.shadowColor = `rgba(${p.lit.map((v) => v | 0).join(',')},0.9)`;
      ctx.shadowBlur = Math.min(40, 9000 / Math.max(depth, 200)) * p.glow;
      ctx.fill(); ctx.shadowBlur = 0;
    } else ctx.fill();
  }
}

function drawTexture(p, scr) {
  if (scr.length !== 4) return; // partially clipped: skip
  const tex = p.tex, tw = tex.width, th = tex.height;
  // texture corners: pts[3]=top-left, pts[2]=top-right, pts[0]=bottom-left
  const tl = scr[3], tr = scr[2], bl = scr[0];
  ctx.save();
  ctx.globalAlpha = p.alpha;
  if (p.glow) ctx.globalCompositeOperation = 'lighter';
  ctx.setTransform(dpr * (tr[0] - tl[0]) / tw, dpr * (tr[1] - tl[1]) / tw, dpr * (bl[0] - tl[0]) / th, dpr * (bl[1] - tl[1]) / th, dpr * tl[0], dpr * tl[1]);
  ctx.drawImage(tex, 0, 0);
  ctx.restore();
}

// =========================================================
// Animation loop & public API
// =========================================================
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const lerpAngle = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  if (document.hidden || !enabled) return;
  const dt = now - lastT;
  if (tween) {
    const k = Math.min(1, (now - tween.start) / tween.dur);
    const e = ease(k);
    for (const key of ['x', 'y', 'z', 'pitch', 'fov']) cam[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
    cam.yaw = lerpAngle(tween.from.yaw, tween.to.yaw, e);
    if (k >= 1) tween = null;
    needsFrame = true;
  }
  parallax.x += (parallax.tx - parallax.x) * 0.06;
  parallax.y += (parallax.ty - parallax.y) * 0.06;
  if (Math.abs(parallax.tx - parallax.x) > 0.001 || Math.abs(parallax.ty - parallax.y) > 0.001) needsFrame = true;
  // idle drift is drawn at ~30 fps to save battery
  if (idleDrift && dt > 33) needsFrame = true;
  if (needsFrame) { lastT = now; needsFrame = false; drawFrame(); }
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  needsFrame = true;
}

export function initScene(el) {
  canvas = el;
  ctx = canvas.getContext('2d', { alpha: false });
  resize();
  build();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    parallax.tx = (e.clientX / W - 0.5) * 2;
    parallax.ty = (e.clientY / H - 0.5) * 2;
  });
  running = true;
  requestAnimationFrame(loop);
  drawFrame();
}

/** Glide the camera to a named shot. */
export function setShot(name, { instant = false, dur = 1900 } = {}) {
  const to = SHOTS[name] || SHOTS.hero;
  if (instant || !enabled) { cam = { ...to }; tween = null; needsFrame = true; return; }
  tween = { from: { ...cam }, to, start: performance.now(), dur };
}

export function setSceneOptions({ theme, accent, motion, on }) {
  if (theme) pal = theme === 'light' ? PALETTES.light : PALETTES.dark;
  if (accent) accentRGB = accent === 'lime' ? [198, 255, 0] : [233, 210, 156];
  if (motion !== undefined) idleDrift = motion;
  if (on !== undefined) { enabled = on; if (canvas) canvas.style.opacity = on ? '1' : '0'; }
  if (canvas && (theme || accent)) build();
  needsFrame = true;
}

export function redrawScene() { needsFrame = true; }
