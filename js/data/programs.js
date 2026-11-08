// =========================================================
// programs.js — the three ready-made workouts on the home page
// (Core / Pro / Elite, like the glass cards in the video).
// Each item: exercise id, sets, reps (seconds for hold exercises).
// =========================================================
export const PROGRAMS = {
  core: {
    level: 'beginner', rest: 60, demo: 'squat',
    items: [
      { exId: 'squat', sets: 3, reps: 10 },
      { exId: 'incline-push-up', sets: 3, reps: 8 },
      { exId: 'glute-bridge', sets: 3, reps: 12 },
      { exId: 'plank', sets: 2, reps: 20 },
      { exId: 'jumping-jack', sets: 2, reps: 20 },
    ],
  },
  pro: {
    level: 'intermediate', rest: 60, demo: 'press',
    items: [
      { exId: 'lunge', sets: 3, reps: 10 },
      { exId: 'push-up', sets: 3, reps: 12 },
      { exId: 'bent-over-row', sets: 3, reps: 10 },
      { exId: 'shoulder-press', sets: 3, reps: 10 },
      { exId: 'russian-twist', sets: 3, reps: 20 },
    ],
  },
  elite: {
    level: 'advanced', rest: 45, demo: 'burpee',
    items: [
      { exId: 'burpee', sets: 3, reps: 10 },
      { exId: 'romanian-deadlift', sets: 3, reps: 10 },
      { exId: 'diamond-push-up', sets: 3, reps: 10 },
      { exId: 'mountain-climber', sets: 3, reps: 30 },
      { exId: 'side-plank', sets: 2, reps: 30 },
    ],
  },
};
