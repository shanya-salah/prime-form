// =========================================================
// demo.js — animated pose demonstrations (SVG).
//
// Each demo is a list of key poses. A pose is a set of
// ABSOLUTE segment angles in degrees:
//     0 = pointing down, 90 = pointing forward (right),
//   180 = pointing up,  -90 = pointing backward (left).
// In 'front' view, + means "away from the body's middle".
// The figure is built from the hip outwards (forward
// kinematics), then moved so the chosen "root" joint
// (ankle, wrist, hip…) sits where the pose says.
// =========================================================
import { t, ex } from '../core/i18n.js';
import { h, svg } from '../core/dom.js';
import { icon } from '../core/icons.js';

const L = { torso: 52, head: 15, thigh: 44, shin: 42, foot: 13, upper: 29, fore: 27, shoulderW: 30, hipW: 20 };
const FLOOR = 0;

// shorthand: s(...) = side pose, f(...) = front pose
const base = { torso: 180, neck: 0, thigh: [0, 0], shin: [0, 0], foot: [90, 90], upper: [0, 0], fore: [0, 0], root: 'ankle', at: [0, 0], ts: 1, th: 1 };
const P = (o) => ({ ...base, ...o });

/** Demo library. hl = glowing muscles, key = joint whose angle is shown, props = scene items. */
export const DEMOS = {
  squat: { view: 'side', hl: ['thigh'], key: ['hip', 'knee', 'ankle'], frames: [
    P({ upper: [8, 8], fore: [10, 10] }),
    P({ torso: 142, thigh: [96, 96], shin: [-27, -27], upper: [92, 92], fore: [92, 92] }),
  ], mistake: P({ torso: 108, thigh: [92, 92], shin: [-38, -38], upper: [40, 40], fore: [40, 40] }), bad: ['torso'] },

  sumo: { view: 'front', hl: ['thigh'], key: ['hip', 'knee', 'ankle'], frames: [
    P({ thigh: [16, 16], shin: [12, 12], upper: [14, 14], fore: [-150, -150] }),
    P({ thigh: [72, 72], shin: [8, 8], upper: [14, 14], fore: [-150, -150] }),
  ], mistake: P({ thigh: [40, 40], shin: [38, 38], upper: [14, 14], fore: [-150, -150] }), bad: ['thigh', 'shin'] },

  lunge: { view: 'side', hl: ['thigh'], key: ['hip', 'knee', 'ankle'], frames: [
    P({ upper: [-28, -28], fore: [60, 60] }),
    P({ thigh: [90, -18], shin: [0, -92], upper: [-28, -28], fore: [60, 60] }),
  ], mistake: P({ torso: 160, thigh: [104, -14], shin: [36, -88], upper: [-28, -28], fore: [60, 60] }), bad: ['shin'] },

  sideLunge: { view: 'front', hl: ['thigh'], key: ['hip', 'knee', 'ankle'], frames: [
    P({ thigh: [22, 22], shin: [22, 22], upper: [10, 10], fore: [-140, -140], root: 'ankleFar' }),
    P({ torso: 172, thigh: [62, 52], shin: [-6, 52], upper: [10, 10], fore: [-140, -140], root: 'ankleFar' }),
  ], mistake: P({ torso: 145, thigh: [60, 52], shin: [-4, 52], upper: [10, 10], fore: [-140, -140], root: 'ankleFar' }), bad: ['torso'] },

  hinge: { view: 'side', hl: ['thigh', 'torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({}),
    P({ torso: 98, thigh: [14, 14], shin: [-6, -6] }),
  ], mistake: P({ torso: 128, thigh: [86, 86], shin: [-34, -34] }), bad: ['thigh'] },

  wallSit: { view: 'side', hl: ['thigh'], key: ['hip', 'knee', 'ankle'], props: ['wallBack'], frames: [
    P({ torso: 180, thigh: [90, 90], shin: [0, 0], upper: [6, 6], fore: [8, 8] }),
    P({ torso: 180, thigh: [92, 92], shin: [2, 2], upper: [6, 6], fore: [8, 8] }),
  ], mistake: P({ torso: 180, thigh: [50, 50], shin: [-6, -6], upper: [6, 6], fore: [8, 8] }), bad: ['thigh'] },

  calf: { view: 'side', hl: ['shin'], key: ['knee', 'ankle', 'toe'], frames: [
    P({ root: 'toe', at: [14, 0] }),
    P({ root: 'toe', at: [14, 0], foot: [38, 38] }),
  ], mistake: P({ root: 'toe', at: [14, 0], foot: [40, 40], thigh: [24, 24], shin: [-22, -22] }), bad: ['thigh'] },

  hop: { view: 'front', hl: ['shin'], key: ['hip', 'knee', 'ankle'], props: ['rope'], frames: [
    P({ upper: [18, 18], fore: [38, 38], thigh: [4, 4], shin: [3, 3] }),
    P({ upper: [18, 18], fore: [38, 38], thigh: [3, 3], shin: [2, 2], at: [0, 14] }),
  ], mistake: P({ upper: [60, 60], fore: [80, 80], thigh: [-8, -8], shin: [20, 20], at: [0, 34] }), bad: ['upper'] },

  jack: { view: 'front', hl: ['upper', 'thigh'], key: ['hip', 'shoulder', 'wrist'], frames: [
    P({ upper: [8, 8], fore: [8, 8], thigh: [3, 3], shin: [3, 3] }),
    P({ upper: [158, 158], fore: [168, 168], thigh: [20, 20], shin: [20, 20] }),
  ], mistake: P({ upper: [100, 60], fore: [110, 70], thigh: [20, 20], shin: [20, 20] }), bad: ['upper'] },

  highKnees: { view: 'side', hl: ['thigh'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ root: 'ankleFar', thigh: [98, 0], shin: [4, 0], upper: [-40, 40], fore: [40, 120] }),
    P({ root: 'ankle', thigh: [0, 98], shin: [0, 4], upper: [40, -40], fore: [120, 40] }),
  ], mistake: P({ root: 'ankleFar', torso: 158, thigh: [50, 0], shin: [-10, 0], upper: [-40, 40], fore: [40, 120] }), bad: ['thigh'] },

  burpee: { view: 'side', hl: ['thigh', 'upper', 'torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({}),
    P({ torso: 128, thigh: [104, 104], shin: [-30, -30], upper: [6, 6], fore: [0, 0] }),
    P({ torso: 100, thigh: [-80, -80], shin: [-80, -80], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
    P({ torso: 128, thigh: [104, 104], shin: [-30, -30], upper: [6, 6], fore: [0, 0] }),
    P({ upper: [170, 170], fore: [175, 175], at: [0, 22] }),
  ], mistake: P({ torso: 112, thigh: [-60, -60], shin: [-70, -70], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }), bad: ['torso', 'thigh'] },

  climber: { view: 'side', hl: ['thigh', 'torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ torso: 102, thigh: [36, -80], shin: [-70, -80], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
    P({ torso: 102, thigh: [-80, 36], shin: [-80, -70], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
  ], mistake: P({ torso: 74, thigh: [10, -106], shin: [-80, -106], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }), bad: ['torso', 'thigh'] },

  pushup: { view: 'side', hl: ['upper', 'torso'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ torso: 101, thigh: [-79, -79], shin: [-79, -79], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
    P({ torso: 94, thigh: [-86, -86], shin: [-86, -86], upper: [-72, -72], fore: [2, 2], root: 'wrist', at: [30, 0] }),
  ], mistake: P({ torso: 112, thigh: [-104, -104], shin: [-80, -80], upper: [-40, -40], fore: [2, 2], root: 'wrist', at: [30, 0] }), bad: ['torso', 'thigh'] },

  inclinePushup: { view: 'side', hl: ['upper', 'torso'], key: ['shoulder', 'elbow', 'wrist'], props: ['benchFront'], frames: [
    P({ torso: 122, thigh: [-58, -58], shin: [-58, -58], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [44, 40] }),
    P({ torso: 114, thigh: [-66, -66], shin: [-66, -66], upper: [-70, -70], fore: [4, 4], root: 'wrist', at: [44, 40] }),
  ], mistake: P({ torso: 136, thigh: [-80, -80], shin: [-58, -58], upper: [-40, -40], fore: [4, 4], root: 'wrist', at: [44, 40] }), bad: ['torso', 'thigh'] },

  plank: { view: 'side', hl: ['torso'], key: ['shoulder', 'hip', 'ankle'], frames: [
    P({ torso: 94, thigh: [-85, -85], shin: [-85, -85], upper: [0, 0], fore: [90, 90], root: 'wrist', at: [52, 0] }),
    P({ torso: 95, thigh: [-84, -84], shin: [-84, -84], upper: [1, 1], fore: [90, 90], root: 'wrist', at: [52, 0] }),
  ], mistake: P({ torso: 106, thigh: [-103, -103], shin: [-96, -96], upper: [-6, -6], fore: [90, 90], root: 'wrist', at: [52, 0] }), bad: ['torso', 'thigh'] },

  sidePlank: { view: 'side', hl: ['torso'], key: ['shoulder', 'hip', 'ankle'], frames: [
    P({ torso: 108, thigh: [-72, -72], shin: [-72, -72], upper: [0, 178], fore: [90, 180], root: 'wrist', at: [52, 0] }),
    P({ torso: 109, thigh: [-71, -71], shin: [-71, -71], upper: [1, 178], fore: [90, 180], root: 'wrist', at: [52, 0] }),
  ], mistake: P({ torso: 124, thigh: [-92, -92], shin: [-80, -80], upper: [-10, 178], fore: [90, 180], root: 'wrist', at: [52, 0] }), bad: ['torso', 'thigh'] },

  crunch: { view: 'side', hl: ['torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ torso: -88, thigh: [140, 140], shin: [42, 42], upper: [90, 90], fore: [92, 92], root: 'hip', at: [0, 8] }),
    P({ torso: -122, thigh: [140, 140], shin: [42, 42], upper: [110, 110], fore: [112, 112], root: 'hip', at: [0, 8] }),
  ], mistake: P({ torso: -110, neck: 55, thigh: [140, 140], shin: [42, 42], upper: [-150, -150], fore: [100, 100], root: 'hip', at: [0, 8] }), bad: ['head'] },

  bicycle: { view: 'side', hl: ['torso', 'thigh'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ torso: -116, thigh: [170, 104], shin: [96, 100], upper: [-160, -160], fore: [120, 120], root: 'hip', at: [0, 8] }),
    P({ torso: -116, thigh: [104, 170], shin: [100, 96], upper: [-160, -160], fore: [120, 120], root: 'hip', at: [0, 8] }),
  ], mistake: P({ torso: -92, neck: 40, thigh: [150, 100], shin: [90, 95], upper: [-160, -160], fore: [120, 120], root: 'hip', at: [0, 8] }), bad: ['head', 'torso'] },

  legRaise: { view: 'side', hl: ['thigh', 'torso'], key: ['shoulder', 'hip', 'ankle'], frames: [
    P({ torso: -90, thigh: [96, 96], shin: [96, 96], upper: [-90, -90], fore: [-90, -90], root: 'hip', at: [0, 8] }),
    P({ torso: -90, thigh: [176, 176], shin: [176, 176], upper: [-90, -90], fore: [-90, -90], root: 'hip', at: [0, 8] }),
  ], mistake: P({ torso: -90, thigh: [150, 150], shin: [80, 80], upper: [-90, -90], fore: [-90, -90], root: 'hip', at: [0, 8] }), bad: ['shin'] },

  bridge: { view: 'side', hl: ['thigh', 'torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ torso: -88, thigh: [128, 128], shin: [32, 32], upper: [90, 90], fore: [90, 90], root: 'ankle', at: [0, 0] }),
    P({ torso: -62, thigh: [100, 100], shin: [8, 8], upper: [90, 90], fore: [90, 90], root: 'ankle', at: [0, 0] }),
  ], mistake: P({ torso: -76, thigh: [116, 116], shin: [18, 18], upper: [90, 90], fore: [90, 90], root: 'ankle', at: [0, 0] }), bad: ['torso'] },

  kickback: { view: 'side', hl: ['thigh'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ torso: 90, thigh: [0, 0], shin: [-90, -90], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
    P({ torso: 92, thigh: [-100, 0], shin: [176, -90], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }),
  ], mistake: P({ torso: 74, thigh: [-130, 0], shin: [150, -90], upper: [0, 0], fore: [0, 0], root: 'wrist', at: [30, 0] }), bad: ['torso'] },

  superman: { view: 'side', hl: ['torso'], key: ['wrist', 'shoulder', 'hip'], frames: [
    P({ torso: 90, thigh: [-90, -90], shin: [-90, -90], upper: [90, 90], fore: [90, 90], root: 'hip', at: [0, 8] }),
    P({ torso: 104, thigh: [-78, -78], shin: [-76, -76], upper: [104, 104], fore: [104, 104], root: 'hip', at: [0, 8] }),
  ], mistake: P({ torso: 125, neck: -45, thigh: [-90, -90], shin: [-90, -90], upper: [130, 130], fore: [130, 130], root: 'hip', at: [0, 8] }), bad: ['head', 'torso'] },

  curl: { view: 'side', hl: ['fore', 'upper'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ upper: [2, 2], fore: [4, 4] }),
    P({ upper: [4, 4], fore: [158, 158] }),
  ], mistake: P({ torso: 166, upper: [48, 48], fore: [170, 170] }), bad: ['upper', 'torso'] },

  hammer: { view: 'side', hl: ['fore', 'upper'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ upper: [2, 2], fore: [4, 4] }),
    P({ upper: [4, 4], fore: [148, 148] }),
  ], mistake: P({ torso: 166, upper: [44, 44], fore: [165, 165] }), bad: ['upper', 'torso'] },

  tricepsExt: { view: 'side', hl: ['upper'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ upper: [172, 172], fore: [176, 176] }),
    P({ upper: [172, 172], fore: [-14, -14] }),
  ], mistake: P({ upper: [128, 128], fore: [10, 10], torso: 168 }), bad: ['upper'] },

  dip: { view: 'side', hl: ['upper'], key: ['shoulder', 'elbow', 'wrist'], props: ['benchBack'], frames: [
    P({ torso: 178, thigh: [86, 86], shin: [80, 80], upper: [-8, -8], fore: [0, 0], root: 'wrist', at: [-16, 42] }),
    P({ torso: 176, thigh: [80, 80], shin: [72, 72], upper: [-76, -76], fore: [0, 0], root: 'wrist', at: [-16, 42] }),
  ], mistake: P({ torso: 150, thigh: [80, 80], shin: [72, 72], upper: [-110, -110], fore: [10, 10], root: 'wrist', at: [-16, 42] }), bad: ['upper'] },

  press: { view: 'front', hl: ['upper'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ upper: [82, 82], fore: [176, 176] }),
    P({ upper: [166, 166], fore: [172, 172] }),
  ], mistake: P({ upper: [166, 110], fore: [172, 150], torso: 174 }), bad: ['upper'] },

  lateral: { view: 'front', hl: ['upper'], key: ['hip', 'shoulder', 'elbow'], frames: [
    P({ upper: [10, 10], fore: [12, 12] }),
    P({ upper: [86, 86], fore: [92, 92] }),
  ], mistake: P({ upper: [126, 126], fore: [134, 134] }), bad: ['upper'] },

  frontRaise: { view: 'side', hl: ['upper'], key: ['hip', 'shoulder', 'wrist'], frames: [
    P({ upper: [4, 4], fore: [6, 6] }),
    P({ upper: [88, 88], fore: [90, 90] }),
  ], mistake: P({ torso: 160, upper: [124, 124], fore: [126, 126] }), bad: ['torso'] },

  reverseFly: { view: 'front', hl: ['upper'], key: ['hip', 'shoulder', 'wrist'], frames: [
    P({ ts: 0.55, thigh: [6, 6], shin: [4, 4], upper: [2, 2], fore: [4, 4] }),
    P({ ts: 0.55, thigh: [6, 6], shin: [4, 4], upper: [84, 84], fore: [96, 96] }),
  ], mistake: P({ ts: 0.95, thigh: [6, 6], shin: [4, 4], upper: [70, 70], fore: [80, 80] }), bad: ['torso'] },

  row: { view: 'side', hl: ['upper', 'torso'], key: ['shoulder', 'elbow', 'wrist'], frames: [
    P({ torso: 126, thigh: [16, 16], shin: [-10, -10], upper: [0, 0], fore: [0, 0] }),
    P({ torso: 126, thigh: [16, 16], shin: [-10, -10], upper: [-104, -104], fore: [-6, -6] }),
  ], mistake: P({ torso: 168, thigh: [16, 16], shin: [-10, -10], upper: [-60, -60], fore: [20, 20] }), bad: ['torso'] },

  twist: { view: 'front', hl: ['torso'], key: ['hip', 'shoulder', 'wrist'], props: ['floorSit'], frames: [
    P({ ts: 0.86, th: 0.4, thigh: [70, 70], shin: [12, 12], upper: [-28, 46], fore: [-62, 78], root: 'hip', at: [0, 10], torso: 170 }),
    P({ ts: 0.86, th: 0.4, thigh: [70, 70], shin: [12, 12], upper: [46, -28], fore: [78, -62], root: 'hip', at: [0, 10], torso: 190 }),
  ], mistake: P({ ts: 0.86, th: 0.4, thigh: [70, 70], shin: [12, 12], upper: [-80, 100], fore: [-110, 130], root: 'hip', at: [0, 10], torso: 150 }), bad: ['torso'] },

  obliqueStand: { view: 'front', hl: ['torso'], key: ['shoulder', 'hip', 'knee'], frames: [
    P({ upper: [120, 120], fore: [-120, -120] }),
    P({ torso: 166, upper: [120, 70], fore: [-120, -110], thigh: [0, 96], shin: [0, 4], root: 'ankle' }),
    P({ upper: [120, 120], fore: [-120, -120] }),
    P({ torso: 194, upper: [70, 120], fore: [-110, -120], thigh: [96, 0], shin: [4, 0], root: 'ankleFar' }),
  ], mistake: P({ torso: 140, upper: [120, 40], fore: [-120, -80], thigh: [0, 50], shin: [0, 0] }), bad: ['torso'] },

  chop: { view: 'front', hl: ['torso', 'upper'], key: ['hip', 'shoulder', 'wrist'], frames: [
    P({ torso: 186, upper: [142, -150], fore: [146, -154], thigh: [12, 12], shin: [10, 10] }),
    P({ torso: 172, upper: [-36, 46], fore: [-40, 50], thigh: [16, 6], shin: [-4, 12] }),
  ], mistake: P({ torso: 150, upper: [-60, 70], fore: [-70, 80], thigh: [16, 6], shin: [-4, 12] }), bad: ['torso'] },
};

// =========================================================
// Forward kinematics
// =========================================================
const rad = (d) => (d * Math.PI) / 180;
const dir = (a, side = 1) => [Math.sin(rad(a)) * side, -Math.cos(rad(a))]; // y-up coordinates

/** Build all joint positions for a pose (y up). Returns { near:{…}, far:{…}, core:{…} } */
function solve(pose, view) {
  const add = (p, a, len, side = 1) => { const d = dir(a, side); return [p[0] + d[0] * len, p[1] + d[1] * len]; };
  const hip = [0, 0];
  const torsoLen = L.torso * pose.ts;
  const neck = add(hip, pose.torso, torsoLen);
  const head = add(neck, pose.torso + pose.neck, L.head);
  const J = { core: { hip, neck, head }, near: {}, far: {} };
  ['near', 'far'].forEach((s, i) => {
    let side = 1, hipP = hip, sh = neck;
    if (view === 'front') {
      side = i === 0 ? -1 : 1; // near = screen-left limb
      const tdir = dir(pose.torso);
      const perp = [-tdir[1], tdir[0]]; // perpendicular to the torso
      hipP = [hip[0] + perp[0] * (L.hipW / 2) * side * -1, hip[1] + perp[1] * (L.hipW / 2) * side * -1];
      sh = [neck[0] + perp[0] * (L.shoulderW / 2) * side * -1, neck[1] + perp[1] * (L.shoulderW / 2) * side * -1];
    }
    const knee = add(hipP, pose.thigh[i], L.thigh * pose.th, side);
    const ankle = add(knee, pose.shin[i], L.shin, side);
    const toe = view === 'front' ? [ankle[0] + 6 * side, ankle[1] - 2] : add(ankle, pose.foot[i], L.foot);
    const elbow = add(sh, pose.upper[i], L.upper, side);
    const wrist = add(elbow, pose.fore[i], L.fore, side);
    J[s] = { hip: hipP, shoulder: sh, knee, ankle, toe, elbow, wrist };
  });
  // move the figure so the root joint sits at "at"
  const rootMap = { ankle: J.near.ankle, ankleFar: J.far.ankle, wrist: J.near.wrist, hip: J.core.hip, toe: J.near.toe, knee: J.near.knee };
  let r = rootMap[pose.root] || J.near.ankle;
  if (view === 'front' && pose.root === 'ankle') r = [0, Math.min(J.near.ankle[1], J.far.ankle[1])];
  const dx = pose.at[0] - (view === 'front' && pose.root === 'ankle' ? 0 : r[0]);
  const dy = pose.at[1] - r[1];
  const mv = (p) => [p[0] + dx, p[1] + dy];
  for (const g of ['core', 'near', 'far']) for (const k in J[g]) J[g][k] = mv(J[g][k]);
  return J;
}

function lerpPose(a, b, k) {
  const out = { ...a };
  for (const key of ['torso', 'neck', 'ts', 'th']) out[key] = a[key] + (b[key] - a[key]) * k;
  for (const key of ['thigh', 'shin', 'foot', 'upper', 'fore']) out[key] = a[key].map((v, i) => v + (b[key][i] - v) * k);
  return out;
}
/** Figure for a blend between two key poses; hip placement is blended too (no jumps). */
/** Exported for tests: joint positions for a blend between two key poses. */
export function blend(demo, a, b, k) {
  const ja = solve(a, demo.view), jb = solve(b, demo.view);
  const pose = lerpPose(a, b, k);
  const j = solve({ ...pose, root: 'hip', at: [0, 0] }, demo.view);
  const hx = ja.core.hip[0] + (jb.core.hip[0] - ja.core.hip[0]) * k;
  const hy = ja.core.hip[1] + (jb.core.hip[1] - ja.core.hip[1]) * k;
  for (const g of ['core', 'near', 'far']) for (const n in j[g]) j[g][n] = [j[g][n][0] + hx, j[g][n][1] + hy];
  return j;
}

function angleAt(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const d = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(...v1) * Math.hypot(...v2)) || 1);
  return Math.round((Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI);
}
function jointPos(j, name) { return name === 'neck' || name === 'head' ? j.core[name] : j.near[name] || j.core[name]; }

// =========================================================
// Drawing (SVG strings)
// =========================================================
const SEGS = [
  ['thigh', 'hip', 'knee'], ['shin', 'knee', 'ankle'], ['foot', 'ankle', 'toe'],
  ['upper', 'shoulder', 'elbow'], ['fore', 'elbow', 'wrist'],
];

function figureSVG(j, demo, { color = 'var(--demo-body)', hlColor = 'var(--accent)', badColor = '#EF4444', bad = [], ghost = false } = {}) {
  const tx = (p) => `${p[0].toFixed(1)},${(-p[1]).toFixed(1)}`;
  const line = (a, b, w, c, op = 1) => `<line x1="${a[0].toFixed(1)}" y1="${(-a[1]).toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${(-b[1]).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  const segColor = (name) => (bad.includes(name) ? badColor : demo.hl.includes(name) ? hlColor : color);
  let out = '';
  const drawLimbs = (side, op) => {
    const s = j[side];
    // torso link for front view (shoulder to hip on each side)
    if (demo.view === 'front') out += line(s.shoulder, s.hip, 7, segColor('torso'), op * 0.9);
    for (const [name, a, b] of SEGS) {
      if (name === 'foot' && demo.view === 'front') continue;
      out += line(s[a], s[b], name === 'thigh' ? 9 : name === 'foot' ? 5 : 7, segColor(name), op);
    }
    if (!ghost) for (const k of ['elbow', 'knee', 'wrist', 'ankle']) out += `<circle cx="${s[k][0].toFixed(1)}" cy="${(-s[k][1]).toFixed(1)}" r="3.2" fill="var(--demo-joint)" opacity="${op}"/>`;
  };
  const farOp = demo.view === 'side' ? 0.45 : 1;
  if (ghost) {
    drawLimbs('far', 1); drawLimbs('near', 1);
    out += line(j.core.hip, j.core.neck, 9, color);
    out += `<circle cx="${j.core.head[0].toFixed(1)}" cy="${(-j.core.head[1]).toFixed(1)}" r="9" fill="none" stroke="${color}" stroke-width="3"/>`;
    return `<g class="ghost" opacity="0.16">${out}</g>`;
  }
  drawLimbs('far', farOp);
  if (demo.view === 'front') {
    out += line(j.near.shoulder, j.far.shoulder, 7, segColor('torso'));
    out += line(j.near.hip, j.far.hip, 7, segColor('torso'));
  } else {
    out += line(j.core.hip, j.core.neck, 11, segColor('torso'));
  }
  drawLimbs('near', 1);
  const hc = bad.includes('head') ? badColor : color;
  out += `<circle cx="${j.core.head[0].toFixed(1)}" cy="${(-j.core.head[1]).toFixed(1)}" r="10" fill="var(--demo-head)" stroke="${hc}" stroke-width="3"/>`;
  return out;
}

function propsSVG(demo) {
  const p = demo.props || [];
  let s = '';
  if (p.includes('wallBack')) s += '<rect x="-70" y="-150" width="8" height="150" rx="2" fill="var(--demo-prop)"/>';
  if (p.includes('benchFront')) s += '<rect x="20" y="-40" width="70" height="8" rx="3" fill="var(--demo-prop)"/><rect x="28" y="-32" width="6" height="32" fill="var(--demo-prop)"/><rect x="76" y="-32" width="6" height="32" fill="var(--demo-prop)"/>';
  if (p.includes('benchBack')) s += '<rect x="-60" y="-42" width="62" height="8" rx="3" fill="var(--demo-prop)"/><rect x="-54" y="-34" width="6" height="34" fill="var(--demo-prop)"/><rect x="-10" y="-34" width="6" height="34" fill="var(--demo-prop)"/>';
  if (p.includes('rope')) s += '<path d="M-44,-120 Q-60,10 0,8 Q60,10 44,-120" fill="none" stroke="var(--demo-prop)" stroke-width="2" stroke-dasharray="4 4"/>';
  return s;
}

/** A static icon of a demo (used for category tiles). */
export function demoIcon(key, frameIndex = 1, size = 46) {
  const demo = DEMOS[key];
  if (!demo) return h('div', { class: 'fig' });
  const j = solve(demo.frames[Math.min(frameIndex, demo.frames.length - 1)], demo.view);
  const box = bounds(j, demo);
  const markup = `<svg class="fig demo-svg" viewBox="${box.join(' ')}" width="${size}" height="${size}" aria-hidden="true">${figureSVG(j, demo)}</svg>`;
  return svg(markup);
}

function bounds(j, demo) {
  const pts = [];
  for (const g of ['core', 'near', 'far']) for (const k in j[g]) pts.push(j[g][k]);
  let minX = Math.min(...pts.map((p) => p[0])) - 16, maxX = Math.max(...pts.map((p) => p[0])) + 16;
  let minY = Math.min(...pts.map((p) => -p[1])) - 16, maxY = Math.max(...pts.map((p) => -p[1])) + 10;
  const w = maxX - minX, hgt = maxY - minY, s = Math.max(w, hgt);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return [cx - s / 2, cy - s / 2, s, s];
}

// =========================================================
// Animated player (used on the exercise detail page)
// =========================================================
export function demoPlayer(exercise) {
  const demo = DEMOS[exercise.demo];
  const text = ex(exercise.id);
  const stage = h('div', { class: 'demo-stage' });
  const caption = h('div', { class: 'demo-caption' });
  const angleBadge = h('div', { class: 'demo-angle' });
  let playing = true, speed = 1, mistake = false, raf = 0, t0 = performance.now(), paused = 0;

  // Fixed viewBox that fits every frame (so the figure does not jump around)
  const all = [...demo.frames, demo.mistake].map((f) => bounds(solve(f, demo.view), demo));
  const minX = Math.min(...all.map((b) => b[0])), minY = Math.min(...all.map((b) => b[1]));
  const maxX = Math.max(...all.map((b) => b[0] + b[2])), maxY = Math.max(...all.map((b) => b[1] + b[3]));
  const pad = 10;
  const vb = [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2];

  const seq = [...demo.frames, demo.frames[0]];
  const SEG_MS = 1300, HOLD_MS = 450;
  const segCount = seq.length - 1;
  const cycle = segCount * (SEG_MS + HOLD_MS);

  function frameAt(ms) {
    const tt = ms % cycle;
    const seg = Math.floor(tt / (SEG_MS + HOLD_MS));
    const local = tt - seg * (SEG_MS + HOLD_MS);
    const k = local < HOLD_MS ? 0 : (local - HOLD_MS) / SEG_MS;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    return { seg, k: e, holding: local < HOLD_MS };
  }

  function draw(now) {
    const ms = Math.max(0, playing ? (now - t0) * speed : paused);
    if (playing) paused = ms;
    let j, phase, a, b;
    if (mistake) {
      const k = 0.5 - 0.5 * Math.cos((ms / 2600) * Math.PI * 2);
      a = demo.frames[0]; b = demo.mistake;
      j = blend(demo, a, b, Math.min(1, k * 1.15));
      phase = t('exercise.wrong');
    } else {
      const f = frameAt(ms);
      a = seq[f.seg]; b = seq[f.seg + 1];
      j = blend(demo, a, b, f.k);
      phase = f.seg === 0 && f.holding ? t('exercise.phaseStart') : f.seg === segCount - 1 ? t('exercise.phaseReturn') : t('exercise.phaseMove');
    }
    const ghost = solve(demo.frames[0], demo.view);
    const target = solve(mistake ? demo.mistake : demo.frames[1] || demo.frames[0], demo.view);
    const [ka, kb, kc] = demo.key.map((n) => jointPos(j, n));
    const deg = angleAt(ka, kb, kc);
    // movement direction arrow (from start pose to target pose of the key joint's end point)
    const from = jointPos(ghost, demo.key[2]), to = jointPos(target, demo.key[2]);
    const arrow = Math.hypot(to[0] - from[0], to[1] - from[1]) > 12
      ? `<path d="M${from[0].toFixed(1)},${(-from[1]).toFixed(1)} Q${((from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.25).toFixed(1)},${(-(from[1] + to[1]) / 2 + (to[0] - from[0]) * 0.25).toFixed(1)} ${to[0].toFixed(1)},${(-to[1]).toFixed(1)}" fill="none" stroke="${mistake ? '#EF4444' : 'var(--accent)'}" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#arrowHead)" opacity="0.8"/>`
      : '';
    // angle arc at key joint
    const r = 16;
    const a1 = Math.atan2(-(ka[1] - kb[1]), ka[0] - kb[0]), a2 = Math.atan2(-(kc[1] - kb[1]), kc[0] - kb[0]);
    let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const p1 = [kb[0] + Math.cos(a1) * r, -kb[1] + Math.sin(a1) * r], p2 = [kb[0] + Math.cos(a1 + da) * r, -kb[1] + Math.sin(a1 + da) * r];
    const arc = `<path d="M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${r},${r} 0 0 ${da > 0 ? 1 : 0} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;

    stage.innerHTML = `<svg class="demo-svg" viewBox="${vb.map((v) => v.toFixed(1)).join(' ')}" role="img" aria-label="${text.name}">
      <defs><marker id="arrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${mistake ? '#EF4444' : 'var(--accent)'}"/></marker>
      <radialGradient id="floorGlow"><stop offset="0" stop-color="var(--accent)" stop-opacity="0.18"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${((vb[0] + vb[2] / 2)).toFixed(1)}" cy="2" rx="${(vb[2] * 0.45).toFixed(1)}" ry="8" fill="url(#floorGlow)"/>
      <line x1="${vb[0]}" y1="${FLOOR}" x2="${vb[0] + vb[2]}" y2="${FLOOR}" stroke="var(--demo-floor)" stroke-width="1.5"/>
      ${propsSVG(demo)}
      ${figureSVG(ghost, demo, { ghost: true })}
      ${arrow}
      ${figureSVG(j, demo, { bad: mistake ? demo.bad : [] })}
      ${arc}
    </svg>`;
    angleBadge.textContent = `${deg}°`;
    caption.innerHTML = '';
    caption.append(h('span', { class: `phase ${mistake ? 'bad' : ''}` }, phase));
    if (mistake && text.mistakes[0]) caption.append(h('span', { class: 'mistake-text' }, text.mistakes[0]));
    raf = requestAnimationFrame(draw);
  }

  const playBtn = h('button', { class: 'icon-btn', 'aria-label': t('exercise.pause') }, icon('pause'));
  playBtn.addEventListener('click', () => {
    playing = !playing;
    if (playing) t0 = performance.now() - paused / speed;
    playBtn.replaceChildren(icon(playing ? 'pause' : 'play'));
    playBtn.setAttribute('aria-label', playing ? t('exercise.pause') : t('exercise.play'));
  });
  const speedSel = h('select', { class: 'select', style: { height: '36px', width: 'auto' }, 'aria-label': t('exercise.speed') },
    ...[0.5, 1, 1.5].map((s) => h('option', { value: s, selected: s === 1 }, `${s}×`)));
  speedSel.addEventListener('change', () => { const now = performance.now(); paused = (now - t0) * speed; speed = Number(speedSel.value); t0 = now - paused / speed; });
  const mistakeBtn = h('button', { class: 'chip', 'aria-pressed': 'false' }, icon('alert', 'sm'), t('exercise.showMistake'));
  mistakeBtn.addEventListener('click', () => { mistake = !mistake; mistakeBtn.setAttribute('aria-pressed', String(mistake)); });

  const root = h('div', { class: 'demo glass' },
    h('div', { class: 'demo-top' },
      h('span', { class: 'eyebrow' }, t('exercise.demo')),
      h('span', { class: 'badge neutral' }, icon('camera', 'sm'), `${t('exercise.camera')}: ${t('view.' + exercise.view)}`)
    ),
    h('div', { class: 'demo-frame scan-frame' }, stage, angleBadge),
    caption,
    h('div', { class: 'demo-controls' }, playBtn, speedSel, mistakeBtn),
    h('p', { class: 'hint' }, t('exercise.demoNote'))
  );
  raf = requestAnimationFrame(draw);
  return { el: root, destroy: () => cancelAnimationFrame(raf) };
}
