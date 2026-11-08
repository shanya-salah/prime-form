// =========================================================
// analyzers.js — turns body landmarks into coaching.
//
// MediaPipe gives 33 landmarks per frame (x, y in 0…1, plus a
// "visibility" confidence). For each exercise we:
//   1. compute a "metric" (usually a joint angle, e.g. knee angle)
//   2. count reps with a small state machine:
//        rest → (metric passes ENTER) → working → (passes EXIT) → rep!
//   3. run form checks (back angle, knee position, symmetry…)
//   4. give a status: ok (green) / warn (amber) / bad (red)
//
// LIMITATIONS (honest): this is 2D geometry from one camera.
// It cannot see depth well, so checks are simple and can be
// wrong with bad angles, poor light or loose clothing.
// =========================================================

// MediaPipe landmark indices
export const LM = {
  nose: 0, earL: 7, earR: 8, shL: 11, shR: 12, elL: 13, elR: 14, wrL: 15, wrR: 16,
  hipL: 23, hipR: 24, kneeL: 25, kneeR: 26, ankL: 27, ankR: 28, heelL: 29, heelR: 30, footL: 31, footR: 32,
};
const SIDE = {
  L: { S: 11, E: 13, W: 15, H: 23, K: 25, A: 27, HEEL: 29, FOOT: 31, EAR: 7 },
  R: { S: 12, E: 14, W: 16, H: 24, K: 26, A: 28, HEEL: 30, FOOT: 32, EAR: 8 },
};

// ---------- geometry helpers ----------
const deg = (r) => (r * 180) / Math.PI;
export function angle(a, b, c) {
  const v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
  const d = (v1x * v2x + v1y * v2y) / ((Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)) || 1);
  return deg(Math.acos(Math.max(-1, Math.min(1, d))));
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) });
/** Angle of the vector a→b from vertical (0 = straight up/down) */
const tiltFromVertical = (a, b) => deg(Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)));
/** Angle of the vector a→b from horizontal */
const tiltFromHorizontal = (a, b) => deg(Math.atan2(Math.abs(b.y - a.y), Math.abs(b.x - a.x)));
/** signed distance of p from line a→b (positive = above the line on screen) */
function aboveLine(p, a, b) {
  const t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (((b.x - a.x) ** 2 + (b.y - a.y) ** 2) || 1);
  const yOnLine = a.y + (b.y - a.y) * t;
  return yOnLine - p.y; // screen y grows downward
}

/** Build a convenient "pose snapshot" from landmarks. */
export function snapshot(lm, aspect = 4 / 3) {
  const P = lm.map((p) => ({ x: p.x * aspect, y: p.y, visibility: p.visibility ?? 1 }));
  const vis = (s) => ['S', 'E', 'W', 'H', 'K', 'A'].reduce((sum, k) => sum + P[SIDE[s][k]].visibility, 0);
  const side = vis('L') >= vis('R') ? 'L' : 'R';
  const pick = (s) => Object.fromEntries(Object.entries(SIDE[s]).map(([k, i]) => [k, P[i]]));
  const j = pick(side), L = pick('L'), R = pick('R');
  const mS = mid(L.S, R.S), mH = mid(L.H, R.H), mA = mid(L.A, R.A), mW = mid(L.W, R.W);
  const torsoLen = dist(mS, mH) || 0.0001;
  return {
    P, side, j, L, R, mS, mH, mA, mW, torsoLen,
    shoulderW: dist(L.S, R.S), hipW: dist(L.H, R.H),
    idx: SIDE[side], idxL: SIDE.L, idxR: SIDE.R,
    shin: dist(j.K, j.A) || 0.0001, thigh: dist(j.H, j.K) || 0.0001, upperArm: dist(j.S, j.E) || 0.0001,
  };
}

// ---------- reusable checks ----------
const C = {
  backLean: (max, sev = 'warn') => ({ key: 'backStraight', sev, when: 'phase', joints: ['S', 'H'], test: (s) => tiltFromVertical(s.j.H, s.j.S) > max }),
  bodyLine: (minAngle = 160) => ({
    key: 'hipsSag', sev: 'warn', when: 'always', joints: ['H'],
    test: (s) => {
      const a = angle(s.j.S, s.j.H, s.j.A);
      if (a >= minAngle) return false;
      const up = aboveLine(s.j.H, s.j.S, s.j.A);
      return up < 0 ? 'hipsSag' : 'hipsHigh';
    },
  }),
  armsEven: (maxDiff, fn) => ({ key: 'armsEven', sev: 'warn', when: 'phase', joints: ['E', 'W'], test: (s) => Math.abs(fn(s, 'L') - fn(s, 'R')) > maxDiff }),
  shrug: () => ({
    key: 'shoulders', sev: 'warn', when: 'phase', joints: ['S'],
    test: (s, st) => {
      const d = ((s.L.S.y - s.P[LM.earL].y) + (s.R.S.y - s.P[LM.earR].y)) / 2 / s.torsoLen;
      if (st.neckBase === undefined || st.frames < 20) { st.neckBase = st.neckBase === undefined ? d : st.neckBase * 0.9 + d * 0.1; return false; }
      return d < st.neckBase * 0.62;
    },
  }),
};

const sideAngle = (a, b, c) => (s, sd) => angle(s[sd][a], s[sd][b], s[sd][c]);

// =========================================================
// Analyzer definitions
// mode: 'reps' | 'hold' | 'alternate'
// dir : 'down' = metric gets SMALLER during the movement
// enter/exit: thresholds; depth: needed at the extreme of the rep
// =========================================================
export const ANALYZERS = {
  squat: {
    view: 'side', need: ['H', 'K', 'A', 'S'], mode: 'reps', dir: 'down',
    metric: (s) => angle(s.j.H, s.j.K, s.j.A), enter: 125, exit: 160, depth: 100, depthKey: 'deeper', minRepMs: 1000,
    checks: [C.backLean(50), C.backLean(62, 'bad'),
      { key: 'kneesForward', sev: 'warn', when: 'phase', joints: ['K'], test: (s) => {
        const facing = Math.sign(s.j.FOOT.x - s.j.HEEL.x) || 1;
        return (s.j.K.x - s.j.FOOT.x) * facing > s.shin * 0.3;
      } }],
  },
  sumo: {
    view: 'front', need: ['H', 'K', 'A'], both: true, mode: 'reps', dir: 'down',
    metric: (s) => (angle(s.L.H, s.L.K, s.L.A) + angle(s.R.H, s.R.K, s.R.A)) / 2, enter: 140, exit: 162, depth: 112, depthKey: 'deeper', minRepMs: 1000,
    checks: [
      { key: 'kneesToes', sev: 'warn', when: 'always', joints: ['K'], both: true, test: (s) =>
        (angle(s.L.H, s.L.K, s.L.A) + angle(s.R.H, s.R.K, s.R.A)) / 2 < 158 && dist(s.L.K, s.R.K) < dist(s.L.A, s.R.A) * 0.85 },
      { key: 'balance', sev: 'warn', when: 'phase', joints: ['S'], test: (s) => tiltFromVertical(s.mH, s.mS) > 15 },
    ],
  },
  lunge: {
    view: 'side', need: ['H', 'K', 'A', 'S'], mode: 'reps', dir: 'down',
    metric: (s) => Math.min(angle(s.L.H, s.L.K, s.L.A), angle(s.R.H, s.R.K, s.R.A)), enter: 132, exit: 160, depth: 108, depthKey: 'deeper', minRepMs: 1000,
    checks: [
      { key: 'upright', sev: 'warn', when: 'phase', joints: ['S', 'H'], test: (s) => tiltFromVertical(s.j.H, s.j.S) > 25 },
      { key: 'frontKnee', sev: 'warn', when: 'phase', joints: ['K'], test: (s) => {
        const front = angle(s.L.H, s.L.K, s.L.A) < angle(s.R.H, s.R.K, s.R.A) ? s.L : s.R;
        const facing = Math.sign(front.FOOT.x - front.HEEL.x) || 1;
        return (front.K.x - front.FOOT.x) * facing > s.shin * 0.25;
      } },
    ],
  },
  sideLunge: {
    view: 'front', need: ['H', 'K', 'A'], both: true, mode: 'reps', dir: 'down',
    metric: (s) => Math.min(angle(s.L.H, s.L.K, s.L.A), angle(s.R.H, s.R.K, s.R.A)), enter: 145, exit: 163, depth: 122, depthKey: 'deeper', minRepMs: 1000,
    checks: [{ key: 'chestUp', sev: 'warn', when: 'phase', joints: ['S'], test: (s) => tiltFromVertical(s.mH, s.mS) > 32 }],
  },
  hinge: {
    view: 'side', need: ['S', 'H', 'K', 'A'], mode: 'reps', dir: 'down',
    metric: (s) => angle(s.j.S, s.j.H, s.j.K), enter: 145, exit: 162, depth: 122, depthKey: 'fullRange', minRepMs: 1200,
    checks: [{ key: 'hinge', sev: 'warn', when: 'phase', joints: ['K'], test: (s) => angle(s.j.H, s.j.K, s.j.A) < 135 }],
  },
  wallSit: {
    view: 'side', need: ['S', 'H', 'K', 'A'], mode: 'hold',
    inPos: (s) => { const k = angle(s.j.H, s.j.K, s.j.A); return k > 65 && k < 130; },
    checks: [
      { key: 'deeper', sev: 'warn', when: 'always', joints: ['K'], test: (s) => angle(s.j.H, s.j.K, s.j.A) > 112 },
      { key: 'backStraight', sev: 'warn', when: 'always', joints: ['S'], test: (s) => tiltFromVertical(s.j.H, s.j.S) > 22 },
    ],
  },
  calf: {
    view: 'side', need: ['K', 'A', 'HEEL', 'FOOT'], mode: 'reps', dir: 'up',
    metric: (s) => (s.j.FOOT.y - s.j.HEEL.y) / s.shin, enter: 0.09, exit: 0.045, depth: 0.15, depthKey: 'toes', minRepMs: 800,
    checks: [{ key: 'legsStraight', sev: 'warn', when: 'always', joints: ['K'], test: (s) => angle(s.j.H, s.j.K, s.j.A) < 152 }],
  },
  hop: {
    view: 'front', need: ['H', 'A'], both: true, mode: 'reps', dir: 'up', minRepMs: 220,
    metric: (s, st) => {
      const y = s.mH.y;
      if (st.base === undefined || y > st.base) st.base = y; else st.base += (y - st.base) * 0.01;
      return (st.base - y) / s.torsoLen;
    }, enter: 0.07, exit: 0.03, checks: [],
  },
  jack: {
    view: 'front', need: ['S', 'E', 'W', 'H'], both: true, mode: 'reps', dir: 'up', minRepMs: 450,
    metric: (s) => (angle(s.L.H, s.L.S, s.L.W) + angle(s.R.H, s.R.S, s.R.W)) / 2, enter: 105, exit: 50, depth: 140, depthKey: 'overhead',
    checks: [C.armsEven(38, (s, sd) => angle(s[sd].H, s[sd].S, s[sd].W))],
    repChecks: [{ key: 'fullRange', test: (st) => (st.maxExtra ?? 0) < 1.3 }],
    extra: (s) => dist(s.L.A, s.R.A) / (s.shoulderW || 0.0001), // ankle spread
  },
  highKnees: {
    view: 'front', need: ['H', 'K'], both: true, mode: 'alternate', T: 0.5, minRepMs: 180,
    metric: (s) => {
      // knee height relative to the hip, measured against torso length (the thigh looks
      // shorter when the knee comes toward the camera, so it is not a stable ruler)
      const lift = (sd) => 1 + (s[sd].H.y - s[sd].K.y) / (0.85 * s.torsoLen);
      return lift('L') - lift('R');
    },
    repChecks: [{ key: 'kneesHigher', test: (st) => st.peakAbs < 0.75 }], checks: [],
  },
  burpee: {
    view: 'side', need: ['S', 'H', 'K', 'A'], mode: 'reps', dir: 'down', minRepMs: 1200,
    metric: (s) => (s.j.A.y - s.j.H.y) / ((s.thigh + s.shin) || 0.0001), enter: 0.45, exit: 0.82,
    checks: [{ key: 'bodyLine', sev: 'warn', when: 'phase', joints: ['H'], test: (s) => tiltFromHorizontal(s.j.S, s.j.A) < 30 && angle(s.j.S, s.j.H, s.j.A) < 150 }],
  },
  climber: {
    view: 'side', need: ['S', 'H', 'K', 'A'], mode: 'alternate', T: 32, minRepMs: 200,
    gate: (s) => tiltFromHorizontal(s.j.S, s.j.A) < 45 || 'bodyLine',
    metric: (s) => angle(s.L.S, s.L.H, s.L.K) - angle(s.R.S, s.R.H, s.R.K),
    checks: [{ key: 'hipsHigh', sev: 'warn', when: 'always', joints: ['H'], test: (s) => {
      const legA = angle(s.L.S, s.L.H, s.L.K) > angle(s.R.S, s.R.H, s.R.K) ? s.L.A : s.R.A;
      const up = aboveLine(s.j.H, s.j.S, legA) / s.torsoLen;
      return up > 0.28 ? 'hipsHigh' : up < -0.28 ? 'hipsSag' : false;
    } }],
  },
  pushup: {
    view: 'side', need: ['S', 'E', 'W', 'H', 'A'], mode: 'reps', dir: 'down', minRepMs: 900,
    gate: (s) => tiltFromHorizontal(s.j.S, s.j.A) < 40 || 'bodyLine',
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 125, exit: 152, depth: 100, depthKey: 'fullRange',
    checks: [C.bodyLine(160)],
  },
  inclinePushup: {
    view: 'side', need: ['S', 'E', 'W', 'H', 'A'], mode: 'reps', dir: 'down', minRepMs: 900,
    gate: (s) => tiltFromHorizontal(s.j.S, s.j.A) < 65 || 'bodyLine',
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 125, exit: 152, depth: 100, depthKey: 'fullRange',
    checks: [C.bodyLine(158)],
  },
  plank: {
    view: 'side', need: ['S', 'E', 'H', 'A'], mode: 'hold',
    inPos: (s) => tiltFromHorizontal(s.j.S, s.j.A) < 35,
    checks: [C.bodyLine(163)],
  },
  sidePlank: {
    view: 'front', need: ['S', 'H', 'A'], both: true, mode: 'hold', noViewCheck: true,
    inPos: (s) => { const t = tiltFromHorizontal(s.mS, s.mA); return t > 8 && t < 65; },
    checks: [{ key: 'hipsUp', sev: 'warn', when: 'always', joints: ['H'], test: (s) => angle(s.mS, s.mH, s.mA) < 160 }],
  },
  crunch: {
    view: 'side', need: ['S', 'H', 'K'], mode: 'reps', dir: 'up', minRepMs: 900,
    metric: (s) => deg(Math.atan2(s.j.H.y - s.j.S.y, Math.abs(s.j.S.x - s.j.H.x))), enter: 18, exit: 9, depth: 25, depthKey: 'fullRange',
    checks: [],
  },
  bicycle: {
    view: 'side', need: ['S', 'H', 'K'], mode: 'alternate', T: 28, minRepMs: 450, fastKey: 'slowDown',
    metric: (s) => angle(s.L.S, s.L.H, s.L.K) - angle(s.R.S, s.R.H, s.R.K),
    checks: [{ key: 'core', sev: 'warn', when: 'always', joints: ['S'], test: (s) => deg(Math.atan2(s.j.H.y - s.j.S.y, Math.abs(s.j.S.x - s.j.H.x))) < 6 }],
  },
  legRaise: {
    view: 'side', need: ['S', 'H', 'K', 'A'], mode: 'reps', dir: 'down', minRepMs: 1200,
    metric: (s) => angle(s.j.S, s.j.H, s.j.A), enter: 145, exit: 162, depth: 112, depthKey: 'fullRange',
    checks: [{ key: 'legsStraight', sev: 'warn', when: 'always', joints: ['K'], test: (s) => angle(s.j.S, s.j.H, s.j.A) < 165 && angle(s.j.H, s.j.K, s.j.A) < 148 }],
  },
  bridge: {
    view: 'side', need: ['S', 'H', 'K'], mode: 'reps', dir: 'up', minRepMs: 900,
    metric: (s) => angle(s.j.S, s.j.H, s.j.K), enter: 152, exit: 145, depth: 160, depthKey: 'hipsUp', checks: [],
  },
  kickback: {
    view: 'side', need: ['S', 'H', 'K'], mode: 'reps', dir: 'up', minRepMs: 900,
    gate: (s) => tiltFromVertical(s.j.H, s.j.S) > 50 || 'bodyLine',
    metric: (s) => Math.max(angle(s.L.S, s.L.H, s.L.K), angle(s.R.S, s.R.H, s.R.K)), enter: 130, exit: 112, depth: 150, depthKey: 'fullRange', checks: [],
  },
  superman: {
    view: 'side', need: ['S', 'W', 'H'], mode: 'reps', dir: 'up', minRepMs: 900, fastKey: 'controlled2',
    gate: (s) => tiltFromVertical(s.j.H, s.j.S) > 55 || 'bodyLine',
    metric: (s) => (s.j.S.y - s.j.W.y) / s.upperArm, enter: 0.25, exit: 0.1, checks: [],
  },
  curl: {
    view: 'side', need: ['S', 'E', 'W', 'H'], mode: 'reps', dir: 'down', minRepMs: 1100,
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 110, exit: 142, depth: 68, depthKey: 'fullRange',
    checks: [{ key: 'elbowsStill', sev: 'warn', when: 'phase', joints: ['E'], test: (s) => Math.abs(s.j.E.x - s.j.S.x) / s.upperArm > 0.45 }],
    repChecks: [{ key: 'noSwing', test: (st) => st.tiltRange > 12 }],
  },
  tricepsExt: {
    view: 'side', need: ['S', 'E', 'W'], mode: 'reps', dir: 'down', minRepMs: 1000,
    gate: (s) => s.j.E.y < s.j.S.y || 'overhead',
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 122, exit: 150, depth: 92, depthKey: 'fullRange',
    checks: [{ key: 'upperArms', sev: 'warn', when: 'always', joints: ['E'], test: (s) => tiltFromVertical(s.j.S, s.j.E) > 35 }],
  },
  dip: {
    view: 'side', need: ['S', 'E', 'W'], mode: 'reps', dir: 'down', minRepMs: 900,
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 132, exit: 155, depth: 105, depthKey: 'fullRange',
    checks: [{ key: 'tooDeep', sev: 'bad', when: 'phase', joints: ['S', 'E'], test: (s) => angle(s.j.S, s.j.E, s.j.W) < 70 }],
  },
  press: {
    view: 'front', need: ['S', 'E', 'W'], both: true, mode: 'reps', dir: 'up', minRepMs: 1000,
    gate: (s) => (s.L.W.y < s.L.E.y && s.R.W.y < s.R.E.y) || 'overhead',
    metric: (s) => (angle(s.L.S, s.L.E, s.L.W) + angle(s.R.S, s.R.E, s.R.W)) / 2, enter: 132, exit: 108, depth: 155, depthKey: 'lockout',
    checks: [C.armsEven(25, (s, sd) => angle(s[sd].S, s[sd].E, s[sd].W)), C.shrug()],
  },
  lateral: {
    view: 'front', need: ['S', 'E', 'H'], both: true, mode: 'reps', dir: 'up', minRepMs: 1200, fastKey: 'noSwing',
    metric: (s) => (angle(s.L.H, s.L.S, s.L.E) + angle(s.R.H, s.R.S, s.R.E)) / 2, enter: 55, exit: 30, depth: 74, depthKey: 'fullRange',
    checks: [C.armsEven(20, (s, sd) => angle(s[sd].H, s[sd].S, s[sd].E)), C.shrug(),
      { key: 'tooHigh', sev: 'warn', when: 'phase', joints: ['E'], both: true, test: (s) => (angle(s.L.H, s.L.S, s.L.E) + angle(s.R.H, s.R.S, s.R.E)) / 2 > 112 }],
  },
  frontRaise: {
    view: 'side', need: ['S', 'W', 'H'], mode: 'reps', dir: 'up', minRepMs: 1200, fastKey: 'noSwing',
    metric: (s) => angle(s.j.H, s.j.S, s.j.W), enter: 55, exit: 30, depth: 74, depthKey: 'fullRange',
    checks: [{ key: 'tooHigh', sev: 'warn', when: 'phase', joints: ['W'], test: (s) => angle(s.j.H, s.j.S, s.j.W) > 115 }],
    repChecks: [{ key: 'noSwing', test: (st) => st.tiltRange > 12 }],
  },
  reverseFly: {
    view: 'front', need: ['S', 'W', 'H'], both: true, mode: 'reps', dir: 'up', minRepMs: 1100, noViewCheck: true,
    gate: (s) => (s.mH.y - s.mS.y) / (s.shoulderW || 0.0001) < 1.15 || 'hinge',
    metric: (s) => Math.abs(s.L.W.x - s.R.W.x) / (s.shoulderW || 0.0001), enter: 1.9, exit: 1.4, depth: 2.4, depthKey: 'fullRange',
    checks: [{ key: 'armsEven', sev: 'warn', when: 'phase', joints: ['W'], both: true, test: (s) => Math.abs(s.L.W.y - s.R.W.y) / (s.shoulderW || 0.0001) > 0.35 }],
  },
  row: {
    view: 'side', need: ['S', 'E', 'W', 'H'], mode: 'reps', dir: 'down', minRepMs: 1000,
    gate: (s) => tiltFromVertical(s.j.H, s.j.S) > 25 || 'hinge',
    metric: (s) => angle(s.j.S, s.j.E, s.j.W), enter: 130, exit: 150, depth: 100, depthKey: 'fullRange',
    checks: [], repChecks: [{ key: 'noSwing', test: (st) => st.tiltRange > 15 }],
  },
  twist: {
    view: 'front', need: ['S', 'W', 'H'], both: true, mode: 'alternate', T: 0.45, minRepMs: 500, fastKey: 'twist', noViewCheck: true,
    metric: (s) => (s.mW.x - s.mH.x) / (s.shoulderW || 0.0001),
    repChecks: [{ key: 'rotateMore', test: (st) => st.peakAbs < 0.6 }], checks: [],
  },
  obliqueStand: {
    view: 'front', need: ['E', 'K'], both: true, mode: 'alternate', T: 0.38, minRepMs: 700, fastKey: 'controlled2',
    metric: (s) => (dist(s.R.E, s.R.K) - dist(s.L.E, s.L.K)) / s.torsoLen,
    checks: [{ key: 'balance', sev: 'warn', when: 'always', joints: ['H'], test: (s, st) => {
      st.hipX0 = st.hipX0 ?? s.mH.x;
      return Math.abs(s.mH.x - st.hipX0) / (s.shoulderW || 0.0001) > 0.9;
    } }],
  },
  chop: {
    view: 'front', need: ['S', 'W', 'H'], both: true, mode: 'reps', dir: 'up', minRepMs: 900, fastKey: 'twist',
    metric: (s) => (s.mW.y - s.mS.y) / s.torsoLen, enter: 0.7, exit: 0.1, depth: 0.9, depthKey: 'fullRange', checks: [],
  },
};

/** Feedback keys an analyser can produce (shown on the exercise page). */
export function analyzerKeys(aiKey) {
  const a = ANALYZERS[aiKey];
  if (!a) return [];
  const keys = new Set();
  (a.checks || []).forEach((c) => { keys.add(c.key); if (c.key === 'hipsSag') keys.add('hipsHigh'); if (c.key === 'hipsHigh') keys.add('hipsSag'); });
  (a.repChecks || []).forEach((c) => keys.add(c.key));
  if (a.depthKey) keys.add(a.depthKey);
  if (a.fastKey) keys.add(a.fastKey); else if (a.minRepMs >= 800) keys.add('slowDown');
  if (typeof a.gate === 'function') { const g = String(a.gate.toString().match(/'(\w+)'/)?.[1] || ''); if (g) keys.add(g); }
  return [...keys];
}

// =========================================================
// Engine: feed it landmarks every frame
// =========================================================
export function createEngine(aiKey, { leniency = 0 } = {}) {
  // copy the config so per-workout changes never touch the shared definition
  const cfg = { ...(ANALYZERS[aiKey] || ANALYZERS.squat) };
  // difficulty: beginners get a slightly easier depth target, advanced a stricter one
  if (cfg.depth !== undefined && Math.abs(cfg.depth) > 20) cfg.depth = cfg.dir === 'down' ? cfg.depth + leniency : cfg.depth - leniency;
  const st = {
    frames: 0, reps: 0, phase: 'rest', repStart: 0, extreme: null, tiltMin: 999, tiltMax: -999, maxExtra: 0,
    side: 0, lastAlt: 0, peakAbs: 0, holdMs: 0, lastT: 0, good: 0, total: 0, ema: null, issues: {}, lastIssue: {},
  };
  const smooth = (lm) => {
    if (!st.ema) { st.ema = lm.map((p) => ({ ...p })); return st.ema; }
    const a = 0.55;
    st.ema = lm.map((p, i) => ({ x: st.ema[i].x + (p.x - st.ema[i].x) * a, y: st.ema[i].y + (p.y - st.ema[i].y) * a, z: p.z, visibility: p.visibility }));
    return st.ema;
  };
  const jointIdx = (s, names, both) => names.flatMap((n) => (both || cfg.both ? [s.idxL[n], s.idxR[n]] : [s.idx[n]]));
  const tally = (key, now) => {
    if (!key) return;
    if (now - (st.lastIssue[key] || 0) > 2500) { st.issues[key] = (st.issues[key] || 0) + 1; st.lastIssue[key] = now; }
  };

  function update(landmarks, now, aspect) {
    const out = { status: 'idle', msg: null, sev: null, bad: [], repDone: false, repMsg: null, reps: st.reps, holdSec: st.holdMs / 1000, metric: null, inPos: false };
    const dt = st.lastT ? Math.min(200, now - st.lastT) : 0;
    st.lastT = now;
    if (!landmarks) { out.msg = 'noBody'; return out; }
    st.frames++;
    const s = snapshot(smooth(landmarks), aspect);

    // 1) can we see the needed joints?
    const needIdx = jointIdx(s, cfg.need, cfg.both);
    if (needIdx.some((i) => (s.P[i].visibility ?? 0) < 0.5)) { out.msg = 'fullBody'; out.sev = 'warn'; return out; }

    // 2) camera angle check
    let viewMsg = null;
    if (!cfg.noViewCheck) {
      const ratio = s.shoulderW / s.torsoLen;
      if (cfg.view === 'side' && ratio > 0.62) viewMsg = 'turnSide';
      if (cfg.view === 'front' && ratio < 0.3) viewMsg = 'faceCamera';
    }

    // 3) position gate (e.g. "get into plank position")
    if (cfg.gate) {
      const g = cfg.gate(s);
      if (g !== true) { out.msg = viewMsg || g; out.sev = 'warn'; out.status = 'warn'; return out; }
    }
    out.inPos = true;

    // 4) form checks
    const problems = [];
    const inPhase = st.phase === 'work';
    for (const c of cfg.checks || []) {
      if (c.when === 'phase' && !inPhase && cfg.mode === 'reps') continue;
      const r = c.test(s, st);
      if (r) problems.push({ key: typeof r === 'string' ? r : c.key, sev: c.sev, joints: jointIdx(s, c.joints, c.both) });
    }

    // 5) movement / reps
    if (cfg.mode === 'hold') {
      const inPos = cfg.inPos(s);
      out.inPos = inPos;
      if (!inPos) { out.msg = viewMsg || 'hold'; out.sev = 'warn'; out.status = 'warn'; }
      else if (!problems.some((p) => p.sev === 'bad')) st.holdMs += dt;
    } else if (cfg.mode === 'reps') {
      const m = cfg.metric(s, st);
      out.metric = m;
      const down = cfg.dir === 'down';
      const tilt = tiltFromVertical(s.j.H, s.j.S);
      if (st.phase === 'rest' && (down ? m < cfg.enter : m > cfg.enter)) {
        st.phase = 'work'; st.repStart = now; st.extreme = m; st.tiltMin = tilt; st.tiltMax = tilt; st.maxExtra = 0;
      } else if (st.phase === 'work') {
        st.extreme = down ? Math.min(st.extreme, m) : Math.max(st.extreme, m);
        st.tiltMin = Math.min(st.tiltMin, tilt); st.tiltMax = Math.max(st.tiltMax, tilt);
        if (cfg.extra) st.maxExtra = Math.max(st.maxExtra, cfg.extra(s));
        if (down ? m > cfg.exit : m < cfg.exit) {
          st.phase = 'rest'; st.reps++; out.repDone = true;
          st.tiltRange = st.tiltMax - st.tiltMin;
          const ms = now - st.repStart;
          if (cfg.depth !== undefined && (down ? st.extreme > cfg.depth : st.extreme < cfg.depth)) out.repMsg = cfg.depthKey;
          for (const rc of cfg.repChecks || []) if (!out.repMsg && rc.test(st)) out.repMsg = rc.key;
          if (!out.repMsg && ms < (cfg.minRepMs || 0)) out.repMsg = cfg.fastKey || 'slowDown';
        }
      }
    } else if (cfg.mode === 'alternate') {
      const m = cfg.metric(s, st);
      out.metric = m;
      st.peakAbs = Math.max(st.peakAbs, Math.abs(m));
      const sideNow = m > cfg.T ? 1 : m < -cfg.T ? -1 : 0;
      if (sideNow !== 0 && sideNow !== st.side) {
        const ms = now - (st.lastAlt || now);
        st.side = sideNow; st.reps++; out.repDone = true;
        for (const rc of cfg.repChecks || []) if (!out.repMsg && st.reps > 1 && rc.test(st)) out.repMsg = rc.key;
        if (!out.repMsg && st.lastAlt && ms < (cfg.minRepMs || 0)) out.repMsg = cfg.fastKey || 'slowDown';
        st.lastAlt = now; st.peakAbs = 0;
      }
    }

    // 6) status + score
    const worst = problems.find((p) => p.sev === 'bad') || problems[0];
    if (worst) { out.status = worst.sev; out.msg = worst.key; out.bad = worst.joints; tally(worst.key, now); }
    else if (viewMsg) { out.status = 'warn'; out.msg = viewMsg; }
    else if (out.status !== 'warn') out.status = 'ok';
    if (out.repMsg) tally(out.repMsg, now);
    if (out.inPos) { st.total++; st.good += out.status === 'ok' ? 1 : out.status === 'warn' ? 0.5 : 0; }
    out.reps = st.reps;
    out.holdSec = st.holdMs / 1000;
    return out;
  }

  return {
    update,
    get reps() { return st.reps; },
    get holdSec() { return st.holdMs / 1000; },
    score: () => (st.total ? Math.round((st.good / st.total) * 100) : null),
    issues: () => ({ ...st.issues }),
    addRep() { st.reps++; },
    addHoldTime(ms) { st.holdMs += ms; }, // used in manual mode (no camera)
    removeRep() { st.reps = Math.max(0, st.reps - 1); },
    resetSet() { st.reps = 0; st.holdMs = 0; st.phase = 'rest'; st.side = 0; st.peakAbs = 0; st.lastAlt = 0; },
    resetScore() { st.good = 0; st.total = 0; st.issues = {}; },
    cfg,
  };
}
