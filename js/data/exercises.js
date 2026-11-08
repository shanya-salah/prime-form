// =========================================================
// exercises.js — the exercise catalogue (language-neutral data).
// The written instructions for each exercise are in
// text.en.js / text.ar.js / text.ckb.js under the same id.
//
//   cats   : categories it appears in
//   diff   : beginner | intermediate | advanced
//   equip  : equipment keys (see i18n "equip")
//   reps   : recommended reps per set (or seconds when hold: true)
//   sets   : recommended sets       rest : rest seconds
//   view   : best camera angle for the AI coach ('side' | 'front')
//   demo   : animated demonstration (js/components/demo.js)
//   ai     : posture analyser       (js/ai/analyzers.js)
//   met    : energy cost used for the calorie ESTIMATE
//   load   : true if it is normally done with added weight
// =========================================================

export const CATEGORIES = [
  'shoulders', 'chest', 'back', 'arms', 'biceps', 'triceps', 'waist',
  'abs', 'glutes', 'legs', 'thighs', 'calves', 'fullbody', 'cardio',
];

// Which demo pose is used as each category's icon, and which body part glows.
export const CAT_ICON = {
  shoulders: ['press', 1], chest: ['pushup', 1], back: ['row', 1], arms: ['curl', 1], biceps: ['curl', 1],
  triceps: ['tricepsExt', 1], waist: ['twist', 1], abs: ['crunch', 1], glutes: ['bridge', 1], legs: ['squat', 1],
  thighs: ['sumo', 1], calves: ['calf', 1], fullbody: ['jack', 1], cardio: ['highKnees', 1],
};

export const EXERCISES = [
  // ---------- Shoulders ----------
  { id: 'shoulder-press', cats: ['shoulders', 'arms'], diff: 'intermediate', equip: ['dumbbells'], reps: 10, sets: 3, rest: 75, view: 'front', demo: 'press', ai: 'press', met: 5, load: true },
  { id: 'lateral-raise', cats: ['shoulders'], diff: 'beginner', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'front', demo: 'lateral', ai: 'lateral', met: 4, load: true },
  { id: 'front-raise', cats: ['shoulders'], diff: 'beginner', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'frontRaise', ai: 'frontRaise', met: 4, load: true },
  { id: 'reverse-fly', cats: ['shoulders', 'back'], diff: 'intermediate', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'front', demo: 'reverseFly', ai: 'reverseFly', met: 4, load: true },

  // ---------- Chest ----------
  { id: 'push-up', cats: ['chest', 'arms', 'triceps', 'fullbody'], diff: 'beginner', equip: ['none'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'pushup', ai: 'pushup', met: 8, load: false },
  { id: 'incline-push-up', cats: ['chest'], diff: 'beginner', equip: ['bench'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'inclinePushup', ai: 'inclinePushup', met: 6, load: false },
  { id: 'diamond-push-up', cats: ['chest', 'triceps'], diff: 'advanced', equip: ['none'], reps: 10, sets: 3, rest: 75, view: 'side', demo: 'pushup', ai: 'pushup', met: 8, load: false },

  // ---------- Back ----------
  { id: 'bent-over-row', cats: ['back', 'biceps', 'arms'], diff: 'intermediate', equip: ['dumbbells'], reps: 10, sets: 3, rest: 75, view: 'side', demo: 'row', ai: 'row', met: 5, load: true },
  { id: 'superman', cats: ['back'], diff: 'beginner', equip: ['mat'], reps: 12, sets: 3, rest: 45, view: 'side', demo: 'superman', ai: 'superman', met: 3.5, load: false },

  // ---------- Arms / Biceps / Triceps ----------
  { id: 'biceps-curl', cats: ['biceps', 'arms'], diff: 'beginner', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'curl', ai: 'curl', met: 4, load: true },
  { id: 'hammer-curl', cats: ['biceps', 'arms'], diff: 'beginner', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'hammer', ai: 'curl', met: 4, load: true },
  { id: 'overhead-triceps-extension', cats: ['triceps', 'arms'], diff: 'intermediate', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'tricepsExt', ai: 'tricepsExt', met: 4, load: true },
  { id: 'bench-dip', cats: ['triceps', 'arms'], diff: 'intermediate', equip: ['bench'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'dip', ai: 'dip', met: 5, load: false },

  // ---------- Waist ----------
  { id: 'russian-twist', cats: ['waist', 'abs'], diff: 'intermediate', equip: ['mat'], reps: 20, sets: 3, rest: 45, view: 'front', demo: 'twist', ai: 'twist', met: 4, load: false },
  { id: 'bicycle-crunch', cats: ['waist', 'abs'], diff: 'intermediate', equip: ['mat'], reps: 20, sets: 3, rest: 45, view: 'side', demo: 'bicycle', ai: 'bicycle', met: 5, load: false },
  { id: 'side-plank', cats: ['waist', 'abs'], diff: 'intermediate', equip: ['mat'], reps: 25, sets: 2, rest: 45, view: 'front', demo: 'sidePlank', ai: 'sidePlank', met: 3.8, load: false, hold: true, perSide: true },
  { id: 'standing-oblique-crunch', cats: ['waist'], diff: 'beginner', equip: ['none'], reps: 16, sets: 3, rest: 45, view: 'front', demo: 'obliqueStand', ai: 'obliqueStand', met: 4, load: false },
  { id: 'woodchopper', cats: ['waist', 'fullbody'], diff: 'intermediate', equip: ['dumbbells'], reps: 12, sets: 3, rest: 60, view: 'front', demo: 'chop', ai: 'chop', met: 5, load: true, perSide: true },

  // ---------- Abs ----------
  { id: 'crunch', cats: ['abs'], diff: 'beginner', equip: ['mat'], reps: 15, sets: 3, rest: 45, view: 'side', demo: 'crunch', ai: 'crunch', met: 3.8, load: false },
  { id: 'plank', cats: ['abs', 'fullbody'], diff: 'beginner', equip: ['mat'], reps: 30, sets: 3, rest: 45, view: 'side', demo: 'plank', ai: 'plank', met: 3.8, load: false, hold: true },
  { id: 'leg-raise', cats: ['abs'], diff: 'intermediate', equip: ['mat'], reps: 12, sets: 3, rest: 45, view: 'side', demo: 'legRaise', ai: 'legRaise', met: 4, load: false },
  { id: 'mountain-climber', cats: ['abs', 'cardio', 'fullbody'], diff: 'intermediate', equip: ['none'], reps: 30, sets: 3, rest: 45, view: 'side', demo: 'climber', ai: 'climber', met: 8, load: false },

  // ---------- Glutes ----------
  { id: 'glute-bridge', cats: ['glutes'], diff: 'beginner', equip: ['mat'], reps: 15, sets: 3, rest: 45, view: 'side', demo: 'bridge', ai: 'bridge', met: 3.5, load: false },
  { id: 'donkey-kick', cats: ['glutes'], diff: 'beginner', equip: ['mat'], reps: 12, sets: 3, rest: 45, view: 'side', demo: 'kickback', ai: 'kickback', met: 3.5, load: false, perSide: true },

  // ---------- Legs / Thighs ----------
  { id: 'squat', cats: ['legs', 'glutes', 'thighs', 'fullbody'], diff: 'beginner', equip: ['none'], reps: 12, sets: 3, rest: 60, view: 'side', demo: 'squat', ai: 'squat', met: 5, load: false },
  { id: 'lunge', cats: ['legs', 'glutes'], diff: 'intermediate', equip: ['none'], reps: 10, sets: 3, rest: 60, view: 'side', demo: 'lunge', ai: 'lunge', met: 5, load: false, perSide: true },
  { id: 'romanian-deadlift', cats: ['legs', 'glutes', 'back'], diff: 'intermediate', equip: ['dumbbells'], reps: 10, sets: 3, rest: 75, view: 'side', demo: 'hinge', ai: 'hinge', met: 5, load: true },
  { id: 'sumo-squat', cats: ['thighs', 'glutes', 'legs'], diff: 'beginner', equip: ['none'], reps: 12, sets: 3, rest: 60, view: 'front', demo: 'sumo', ai: 'sumo', met: 5, load: false },
  { id: 'side-lunge', cats: ['thighs', 'legs'], diff: 'intermediate', equip: ['none'], reps: 10, sets: 3, rest: 60, view: 'front', demo: 'sideLunge', ai: 'sideLunge', met: 5, load: false, perSide: true },
  { id: 'wall-sit', cats: ['thighs', 'legs'], diff: 'beginner', equip: ['wall'], reps: 30, sets: 3, rest: 60, view: 'side', demo: 'wallSit', ai: 'wallSit', met: 4, load: false, hold: true },

  // ---------- Calves ----------
  { id: 'calf-raise', cats: ['calves'], diff: 'beginner', equip: ['none'], reps: 15, sets: 3, rest: 45, view: 'side', demo: 'calf', ai: 'calf', met: 3.5, load: false },
  { id: 'single-leg-calf-raise', cats: ['calves'], diff: 'intermediate', equip: ['wall'], reps: 12, sets: 3, rest: 45, view: 'side', demo: 'calf', ai: 'calf', met: 3.8, load: false, perSide: true },
  { id: 'jump-rope', cats: ['calves', 'cardio'], diff: 'intermediate', equip: ['jumpRope'], reps: 60, sets: 3, rest: 60, view: 'front', demo: 'hop', ai: 'hop', met: 11, load: false },

  // ---------- Full body / Cardio ----------
  { id: 'burpee', cats: ['fullbody', 'cardio'], diff: 'advanced', equip: ['none'], reps: 10, sets: 3, rest: 75, view: 'side', demo: 'burpee', ai: 'burpee', met: 8, load: false },
  { id: 'jumping-jack', cats: ['cardio', 'fullbody'], diff: 'beginner', equip: ['none'], reps: 30, sets: 3, rest: 45, view: 'front', demo: 'jack', ai: 'jack', met: 8, load: false },
  { id: 'high-knees', cats: ['cardio'], diff: 'intermediate', equip: ['none'], reps: 30, sets: 3, rest: 45, view: 'front', demo: 'highKnees', ai: 'highKnees', met: 8, load: false },
];

export const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
export const inCategory = (cat) => EXERCISES.filter((e) => e.cats.includes(cat));
