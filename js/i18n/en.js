// =========================================================
// English interface text.  ar.js and ckb.js have the SAME keys.
// =========================================================
export default {
  brand: { name: 'PRIME FORM', tagline: 'AI Personal Trainer', tag: 'AI Trainer' },

  nav: {
    home: 'Home', dashboard: 'Dashboard', categories: 'Exercise Categories', library: 'Exercise Library',
    workout: 'Workout', progress: 'Progress Tracking', progressShort: 'Progress', history: 'Workout History',
    profile: 'Profile', settings: 'Settings', music: 'Music', about: 'About', help: 'Help',
    privacy: 'Privacy Policy', favorites: 'Favorite Exercises', startWorkout: 'Start Workout',
    language: 'Language', search: 'Search exercises', menu: 'Open menu', close: 'Close menu',
  },

  common: {
    cancel: 'Cancel', confirm: 'Confirm', save: 'Save', saved: 'Saved', delete: 'Delete', back: 'Back',
    next: 'Next', finish: 'Finish', close: 'Close', start: 'Start', edit: 'Edit', add: 'Add',
    reps: 'Reps', sets: 'Sets', rest: 'Rest', seconds: 'seconds', sec: 's', min: 'min', minutes: 'minutes',
    kg: 'kg', lb: 'lb', of: 'of', total: 'Total', all: 'All', loading: 'Loading…',
    decrease: 'Decrease', increase: 'Increase', today: 'Today', viewAll: 'View all', open: 'Open',
    copy: 'Copy', copied: 'Copied!', optional: 'optional', retry: 'Try again', on: 'On', off: 'Off',
    skip: 'Skip', yes: 'Yes', no: 'No', explore: 'Explore', perSide: 'per side', test: 'Test',
  },

  cats: {
    shoulders: 'Shoulders', chest: 'Chest', back: 'Back', arms: 'Arms', biceps: 'Biceps', triceps: 'Triceps',
    waist: 'Waist', abs: 'Abs', glutes: 'Glutes', legs: 'Legs', thighs: 'Thighs', calves: 'Calves',
    fullbody: 'Full Body', cardio: 'Cardio',
  },
  diff: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  equip: { none: 'No equipment', dumbbells: 'Dumbbells', bench: 'Bench', mat: 'Exercise mat', chair: 'Sturdy chair', jumpRope: 'Jump rope', wall: 'Wall' },
  view: { side: 'Side view', front: 'Front view' },

  home: {
    s1: {
      eyebrow: 'AI-powered personal training',
      t1: 'Your training', t2: 'deserves', t3: 'more.',
      lead: 'A personal trainer in your browser. Learn every exercise step by step, then let the camera-based AI coach check your posture, count your reps and talk you through each set.',
      side: 'Prime One', sideSub: 'AI coach',
      explore: 'Explore Exercises', statEx: 'Exercises', statLang: 'Languages', statPrivate: 'On-device AI',
    },
    s2: { eyebrow: "Today's motivation", title: 'Train with purpose' },
    s3: {
      eyebrow: 'How the AI coach works', title: 'Performance zone',
      lead: 'Pose detection runs locally in your browser. Your video never leaves your device.',
      st1: 'Camera', st1t: 'You allow camera access and step into the frame.',
      st2: 'Pose detection', st2t: 'AI finds 33 body points (shoulders, hips, knees…) every frame.',
      st3: 'Form analysis', st3t: 'Joint angles are compared with the correct technique.',
      st4: 'Live coaching', st4t: 'You get colour feedback, spoken tips and automatic rep counting.',
    },
    s4: {
      eyebrow: 'Personalised programs', title: 'Choose your level',
      core: 'Core', coreTag: 'Beginner · 20 min', pro: 'Pro', proTag: 'Intermediate · 30 min', elite: 'Elite', eliteTag: 'Advanced · 40 min',
      coreB: ['Bodyweight basics', 'Slow, guided tempo', 'Long rests'],
      proB: ['Dumbbell strength', 'Supersets', 'Form score targets'],
      eliteB: ['High-intensity circuits', 'Heavier loads', 'Short rests'],
      start: 'Start program', recommended: 'Recommended for you',
    },
    s5: {
      eyebrow: 'Your dashboard', title: 'Train beyond limits',
      goal: "Today's goal", repsToday: 'Reps today', minutesToday: 'Minutes today', weekWorkouts: 'Workouts this week',
      streak: 'Day streak', totalWorkouts: 'Total workouts', ofGoal: 'of {n} reps', open: 'Open progress',
    },
    s6: {
      eyebrow: 'Recommended exercises', t1: 'Imagine your gym', t2: 'with an AI coach',
      lead: 'Picked for your level and the muscles you trained least this week.',
    },
    scroll: 'Scroll', slide: 'Slide',
  },

  motivation: [
    'Discipline is choosing what you want most over what you want now.',
    'Every rep you do with good form is a rep that builds you, not breaks you.',
    'Strength is earned one controlled movement at a time.',
    'You do not have to be extreme, just consistent.',
    'The body achieves what the mind believes.',
    'Small progress is still progress. Show up today.',
    'Train with patience. Results follow technique.',
    'Your only competition is who you were yesterday.',
  ],

  mega: { title: 'Exercise categories', sub: 'Pick a muscle group to see its exercises.', count: '{n} exercises', all: 'Open full library' },

  library: {
    title: 'Exercise library', sub: 'Every exercise includes step-by-step technique, breathing, common mistakes and an animated demonstration.',
    search: 'Search by name or muscle…', difficulty: 'Difficulty', equipment: 'Equipment', favoritesOnly: 'Favorites only',
    results: '{n} exercises', noTitle: 'No exercises found', noText: 'Try a different word or clear the filters.', clear: 'Clear filters',
    catSub: 'Choose an exercise to see full instructions.',
  },

  exercise: {
    target: 'Target muscles', difficulty: 'Difficulty', equipment: 'Equipment', startPos: 'Starting position',
    steps: 'Step-by-step instructions', breathing: 'Breathing technique', mistakes: 'Common mistakes', safety: 'Safety instructions',
    recReps: 'Repetitions', recSets: 'Sets', rest: 'Rest', start: 'Start this exercise',
    demo: 'Movement demonstration', play: 'Play', pause: 'Pause', speed: 'Speed', showMistake: 'Show common mistake',
    correct: 'Correct form', wrong: 'Common mistake', phaseStart: 'Starting position', phaseMove: 'Movement', phaseReturn: 'Return to start',
    camera: 'Best camera angle', hold: 'Hold {n} s', demoNote: 'Animated pose illustration drawn by the app (not an AI-generated video).',
    addFav: 'Add to favorites', removeFav: 'Remove from favorites', related: 'More {cat} exercises', ai: 'What the AI coach checks',
    notFound: 'Exercise not found', seconds: 'seconds',
  },

  setup: {
    title: 'Workout setup', sub: 'Tell your coach what you are about to do. Everything is saved on this device only.',
    participant: 'Participant name', namePh: 'Your name', bodyWeight: 'Body weight', exercise: 'Exercise',
    equipWeight: 'Equipment weight', equipHint: 'Weight of ONE dumbbell. Use 0 for bodyweight.', reps: 'Repetitions per set',
    holdSecs: 'Hold time per set (seconds)', sets: 'Number of sets', rest: 'Rest between sets (seconds)', difficulty: 'Workout difficulty',
    duration: 'Workout duration (minutes)', durationHint: 'Optional — the session stops when this time is reached.',
    voice: 'Voice guidance', camera: 'Use camera AI coach', start: 'Start workout', choose: 'Choose an exercise…',
    errors: {
      name: 'Please enter a name (max 40 characters).', weight: 'Body weight must be a positive number (20–350 kg).',
      equip: 'Equipment weight must be zero or greater (max 300 kg).', reps: 'Repetitions must be a positive whole number (1–200).',
      sets: 'Sets must be a positive whole number (1–20).', rest: 'Rest must be a whole number from 0 to 600 seconds.',
      exercise: 'Please choose an exercise.', duration: 'Duration must be between 1 and 180 minutes, or empty.',
      fix: 'Please fix the highlighted fields.',
    },
    tipsTitle: 'Camera tips for accurate feedback',
    tips: [
      'Place your phone or laptop 2–3 metres away, at hip height.',
      'Make sure your whole body is inside the frame.',
      'Use good lighting from the front — avoid a bright window behind you.',
      'Wear fitted clothes so the AI can see your joints clearly.',
    ],
    privacy: 'Privacy: the camera image is analysed inside your browser and is never uploaded or recorded.',
  },

  workout: {
    loadingModel: 'Loading AI pose model…', loadingHint: 'First time can take 5–20 seconds depending on your internet.',
    requesting: 'Waiting for camera permission…', scanning: 'Scanning for your body…',
    deniedTitle: 'Camera access was blocked', deniedText: 'Allow the camera in your browser (click the camera/lock icon in the address bar), then try again. You can also continue without the camera and count reps manually.',
    noCamTitle: 'No camera found', noCamText: 'Connect a webcam or continue without the camera.',
    modelTitle: 'The AI model could not be loaded', modelText: 'An internet connection is needed the first time to download the pose model. Check your connection, or continue without the camera.',
    insecureText: 'The camera only works on http://localhost, http://127.0.0.1 or https:// pages. Open the site through Live Server (see README).',
    manual: 'Continue without camera', retry: 'Try again',
    set: 'Set {a} / {b}', reps: 'Reps', time: 'Time', hold: 'Hold', pause: 'Pause', resume: 'Resume', stop: 'Stop',
    stopTitle: 'End this workout?', stopText: 'Your progress so far will be saved.', stopYes: 'End & save', stopNo: 'Keep going',
    leaveTitle: 'Leave the workout?', leaveText: 'Your workout is still running. Leaving will end it and save your progress.',
    ready: 'Get ready', go: 'Go!', rest: 'Rest', next: 'Next: set {n}', skipRest: 'Skip rest', addRep: '+1 rep', minusRep: '−1',
    manualMode: 'Manual mode — tap +1 rep after each repetition.',
    fullBody: 'Step back so your whole body is visible.', turnSide: 'Turn sideways to the camera for this exercise.',
    faceCamera: 'Face the camera for this exercise.', noBody: 'No body detected — step into the frame.',
    tracking: 'Tracking', score: 'Form score', voice: 'Voice', skeleton: 'Skeleton', mirror: 'Mirror',
    statusOk: 'Good form', statusWarn: 'Adjust', statusBad: 'Check form', statusIdle: 'Waiting',
    target: 'Target', paused: 'Paused', limits: 'AI feedback is a guide, not a diagnosis. Camera angle, lighting and clothing affect accuracy. Stop if you feel pain.',
    timeUp: 'Time limit reached.', holdTarget: 'Target {n} s', tips: 'Live coaching',
  },

  fb: {
    good: 'Good posture!', great: 'Great job! Keep it up.', controlled: 'Nice and controlled.',
    backStraight: 'Keep your back straight.', kneesToes: 'Keep your knees aligned with your toes.',
    kneesForward: "Don't let your knees travel too far past your toes.", deeper: 'Bend your knees gradually — go a little deeper.',
    slowDown: 'Your posture needs adjustment. Please slow down.', balance: 'Try to maintain your balance.', core: 'Keep your core engaged.',
    hipsSag: 'Lift your hips — keep one straight line from shoulders to ankles.', hipsHigh: 'Lower your hips in line with your body.',
    elbowsStill: 'Keep your elbows close to your body.', noSwing: "Don't swing — avoid lifting the weights too quickly.",
    fullRange: 'Use the full range of motion.', shoulders: 'Keep your shoulders relaxed.', armsEven: 'Move both arms evenly.',
    tooHigh: 'Stop at shoulder height.', lockout: 'Extend your arms fully at the top.', chestUp: 'Keep your chest up.',
    twist: 'Avoid excessive twisting — move slowly and maintain control.', rotateMore: 'Rotate through your upper body a little more.',
    upright: 'Keep your torso upright.', hipsUp: 'Push your hips higher.', toes: 'Rise fully onto your toes.',
    kneesHigher: 'Lift your knees higher.', upperArms: 'Keep your upper arms still.',
    legsStraight: 'Keep your legs straight.', lowerBack: 'Press your lower back into the floor.', hinge: 'Push your hips back, not down.',
    frontKnee: 'Keep your front knee above your ankle.', hold: 'Hold steady — breathe slowly.', controlled2: 'Maintain controlled movement.',
    jumpSoft: 'Land softly on the balls of your feet.', bodyLine: 'Get into position — keep your body in one line.',
    tooDeep: "Don't go too deep — protect your shoulders.", overhead: 'Bring your arms fully overhead.',
  },

  voice: {
    repsLeft: '{n} repetitions remaining.', oneMore: 'One more!', setDone: 'Set complete. Great work!',
    rest: 'Rest for {n} seconds.', nextSet: 'Get ready for set {n}.', done: 'Workout complete! Amazing effort.',
    halfway: 'Halfway there!', secondsLeft: '{n} seconds left.', start: 'Starting {ex}. {n} sets of {r}.', go: 'Go!',
  },

  summary: {
    title: 'Workout complete', sub: 'Great work, {name}! Here is how it went.', reps: 'Total reps', duration: 'Duration',
    sets: 'Sets done', score: 'Form score', calories: 'Est. calories', caloriesNote: 'Calories are a rough estimate based on body weight and exercise type.',
    issue: 'Most frequent correction', noIssue: 'No frequent corrections — excellent technique!', badges: 'New achievements',
    progress: 'View progress', again: 'Train again', home: 'Back home', saved: 'Saved in your workout history on this device.',
    perSet: 'Reps per set', manual: 'Counted manually', ai: 'Counted by AI', notFound: 'Workout not found.', athlete: 'athlete',
  },

  history: {
    title: 'Workout history', sub: 'All workouts saved on this device.', emptyT: 'No workouts yet', emptyX: 'Finish your first workout and it will appear here.',
    delTitle: 'Delete this workout?', delText: 'This cannot be undone.', deleted: 'Workout deleted', calendar: 'Workout calendar',
    week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], count: '{n} workouts', details: 'Details', prevMonth: 'Previous month', nextMonth: 'Next month',
  },

  progress: {
    title: 'Progress', sub: 'Your training, measured.', workouts: 'Workouts', reps: 'Total reps', time: 'Training time', streak: 'Current streak',
    best: 'Best streak: {n} days', days: 'days', weight: 'Body weight', addWeight: 'Log weight', weekly: 'Workouts per week',
    byEx: 'Reps by exercise', load: 'Equipment weight over time', select: 'Exercise', consistency: 'Consistency — last 12 weeks',
    records: 'Personal records', heaviest: 'Heaviest', mostReps: 'Most reps (one set)', achievements: 'Achievements', locked: 'Locked',
    unlocked: 'Unlocked {date}', noData: 'Not enough data yet — complete a few workouts.', logged: 'Weight logged', less: 'Less', more: 'More',
    exercisesDone: 'Exercises performed', exercise: 'Exercise',
  },

  badges: {
    first: ['First step', 'Complete your first workout'],
    five: ['Getting serious', 'Complete 5 workouts'],
    ten: ['Committed', 'Complete 10 workouts'],
    twentyfive: ['Gym regular', 'Complete 25 workouts'],
    reps100: ['Century', 'Reach 100 total reps'],
    reps1000: ['Rep machine', 'Reach 1,000 total reps'],
    streak3: ['On fire', 'Train 3 days in a row'],
    streak7: ['Unstoppable', 'Train 7 days in a row'],
    perfect: ['Perfect form', 'Finish a workout with a 90%+ form score'],
    explorer: ['Explorer', 'Try 5 different exercises'],
    hour: ['Hour of power', 'Train for 60 minutes in total'],
    early: ['Early bird', 'Finish a workout before 8 am'],
  },

  profile: {
    title: 'Profile', sub: 'Used to personalise recommendations and estimates.', name: 'Name', weight: 'Body weight', height: 'Height (cm)',
    goal: 'Main goal', goals: { fitness: 'General fitness', strength: 'Strength', fat: 'Fat loss', muscle: 'Muscle gain' },
    level: 'Experience level', dailyReps: 'Daily reps goal', dailyMinutes: 'Daily minutes goal', saved: 'Profile saved',
    bmi: 'BMI', bmiNote: 'BMI is a simple screening number and does not measure body fat or health.', member: 'Member since {date}',
  },

  settings: {
    title: 'Settings', sub: 'Everything here is saved automatically on this device.',
    language: 'Language', appearance: 'Appearance', theme: 'Theme', dark: 'Dark', light: 'Light', accent: 'Accent colour', gold: 'Champagne', lime: 'Lime',
    background: '3D background', bg3d: '3D gym', bgPhotos: 'My photos', bgOff: 'Off', bgHint: 'To use your own gym photos, put slide-1.jpg … slide-6.jpg into assets/hero/.',
    bgMissing: 'No photos found in assets/hero/ — using the 3D gym.',
    sound: 'Sound', soundOn: 'Sound effects (rep beeps, timers)', volume: 'Volume',
    voice: 'Voice guidance', voiceOn: 'Spoken coaching', rate: 'Speaking speed', voicePick: 'Voice', auto: 'Automatic',
    voiceMode: 'What to speak', vmSmart: 'Everything', vmReps: 'Reps only', vmFix: 'Corrections only',
    noVoice: 'No voice for this language is installed on your device. Feedback will be shown as text instead.',
    voiceOk: '{n} voice(s) available for this language.',
    camera: 'Camera', camInfo: 'The camera is only used during a workout. Video is processed locally by the pose model and is never uploaded or saved.',
    camStatus: 'Permission status', granted: 'Allowed', denied: 'Blocked', prompt: 'Will ask', unknown: 'Unknown', checkCam: 'Check camera',
    camOk: 'Camera works!', camFail: 'Could not open the camera.', mirror: 'Mirror camera image', skeleton: 'Show skeleton overlay',
    workout: 'Workout preferences', dSets: 'Default sets', dReps: 'Default reps', dRest: 'Default rest (s)', countdown: 'Countdown before each set (s)', dDiff: 'Default difficulty',
    units: 'Measurement units', kgs: 'Kilograms (kg)', lbs: 'Pounds (lb)',
    profile: 'Profile', editProfile: 'Edit profile',
    a11y: 'Accessibility', large: 'Larger text', contrast: 'High contrast', motion: 'Reduce motion',
    data: 'Your data', dataInfo: 'Workouts, settings and favorites are stored in this browser (localStorage). They stay after refresh, but are deleted if you clear browser data or use another browser/device. Export a backup to keep them safe.',
    export: 'Export backup', import: 'Import backup', clear: 'Delete all data', clearT: 'Delete all data?', clearX: 'All workouts, weights, favorites and settings will be removed from this device.',
    cleared: 'All data deleted', imported: 'Backup imported', importErr: 'This file is not a valid PRIME FORM backup.', replay: 'Show onboarding again',
  },

  music: {
    title: 'Workout music', sub: 'Connect Spotify or use the quick playlists below.',
    spotify: 'Spotify', status: 'Status', notConnected: 'Not connected', connected: 'Connected as {name}',
    clientId: 'Spotify Client ID', clientHint: 'From your app in the Spotify Developer Dashboard. The Client ID is public — never paste a Client SECRET here.',
    redirect: 'Redirect URI to add in the dashboard', connect: 'Connect Spotify', disconnect: 'Disconnect', saveId: 'Save Client ID',
    steps: 'Setup steps', stepList: [
      'Open developer.spotify.com/dashboard and log in (the app owner needs Spotify Premium).',
      'Create an app. Choose "Web API" and "Web Playback SDK".',
      'Add the Redirect URI shown above exactly (use 127.0.0.1, not localhost).',
      'In "User Management", add the email of every Spotify account that will log in (max 5 in Development Mode).',
      'Copy the Client ID, paste it here, then press Connect.',
    ],
    premium: 'Spotify rules: playing music inside this website (Web Playback SDK) needs Spotify Premium. Development Mode apps only work for up to 5 users you add in the dashboard, and the app owner must have Premium.',
    free: 'No Premium? Use the quick playlists below — they play through Spotify’s official embedded player (short previews unless you are logged in to Spotify in this browser).',
    intensity: 'Workout intensity', warmup: 'Warm-up', moderate: 'Moderate', high: 'High intensity', cooldown: 'Cool-down',
    quick: 'Quick playlists (no login needed)', paste: 'Or paste any Spotify playlist / album link', pastePh: 'https://open.spotify.com/playlist/…',
    load: 'Load', invalid: 'That is not a Spotify playlist, album or track link.', now: 'Now playing', nothing: 'Nothing playing',
    mine: 'Your playlists', found: 'Workout playlists on Spotify', play: 'Play', volume: 'Volume', ready: 'Web player ready — music plays in this tab.',
    sdkFail: 'Web player could not start: {msg}', notPremium: 'This account is not Premium, so music cannot play inside the website. Use the embedded player instead.',
    authErr: 'Spotify login failed: {msg}', loginOk: 'Spotify connected!', expired: 'Spotify session expired — please connect again.',
    embedNote: 'Official Spotify embed', openApp: 'Open in Spotify', dock: 'Music player', hide: 'Hide player', show: 'Show player', remove: 'Close player',
    needId: 'Enter your Client ID first.', insecure: 'Spotify login needs http://127.0.0.1:5500 or https:// — open the site via Live Server.',
    prev: 'Previous', next: 'Next', loadingPl: 'Loading playlists…', none: 'No playlists found.',
  },

  about: {
    title: 'About PRIME FORM', sub: 'A university project: an AI-powered smart gym and personal trainer that runs in the browser.',
    p1: 'PRIME FORM helps gym members learn correct technique, train with real-time posture feedback and track their progress — in Kurdish Sorani, Arabic and English.',
    stack: 'Technology', stackList: ['HTML, CSS and JavaScript (ES modules) — no build step', 'MediaPipe Pose Landmarker (Google) for pose detection in the browser', 'Web Speech API for voice guidance', 'Spotify Web API, Web Playback SDK and Embed player', 'A custom canvas 3D renderer for the gym background', 'localStorage for saving data on the device'],
    status: 'Feature status',
    done: 'Fully working', doneList: ['Exercise library, categories, search, filters, favorites', 'Animated pose demonstrations', 'Three languages with RTL/LTR switching', 'Workout setup with validation, timer, rest timer, summary', 'History, charts, records, achievements, calendar', 'Settings, themes, units, accessibility, backup/restore'],
    creds: 'Needs your own credentials', credsList: ['Spotify login & in-site playback (free Spotify Client ID; Premium needed for playback)'],
    config: 'Needs internet / configuration', configList: ['First load of the AI pose model and fonts (cached afterwards by the browser)', 'Camera permission in the browser'],
    limits: 'Technical limitations', limitsList: ['Camera pose estimation is 2D and depends on angle, light and clothing — it cannot detect every mistake.', 'Voice availability depends on your device; Kurdish voices are rarely installed, so text is shown instead.', 'Data is stored per browser; there is no cloud account.'],
  },

  help: {
    title: 'Help', sub: 'Answers to common questions and problems.',
    faq: [
      ['How do I start a workout?', 'Press "Start Workout", choose an exercise, check the numbers and press "Start workout". Allow the camera when the browser asks.'],
      ['The camera does not open.', 'Open the site through Live Server (http://127.0.0.1:5500). Click the camera icon in the address bar and choose "Allow". Close other apps that use the camera (Zoom, Teams…).'],
      ['Reps are not counted.', 'Make sure your whole body is visible, stand at the camera angle shown for the exercise (side or front), and move through the full range. You can always tap "+1 rep".'],
      ['Why is the feedback sometimes wrong?', 'The AI estimates your joints from a flat camera image. Baggy clothes, bad light or a wrong angle reduce accuracy. Use it as a guide.'],
      ['Is my video uploaded?', 'No. The model runs inside your browser. Nothing from the camera is sent or stored.'],
      ['No voice in Kurdish?', 'Most devices do not include a Kurdish text-to-speech voice. Feedback is then shown as large text on screen.'],
      ['Where is my data saved?', 'In this browser only. Use Settings → Your data → Export backup to keep a copy or move it to another device.'],
      ['Spotify does not play.', 'In-site playback needs Spotify Premium and a configured Client ID. Without it, use the quick playlists (official Spotify embed).'],
    ],
    contact: 'Still stuck? Read README.md in the project folder — it has a full troubleshooting list.',
  },

  privacy: {
    title: 'Privacy policy', sub: 'Short version: your data stays on your device.',
    sections: [
      ['Camera', 'The camera is used only while a workout is running and only after you allow it. Frames are analysed in your browser by the pose model and are never recorded, uploaded or shared.'],
      ['Data we store', 'Your profile, settings, workouts, body weight entries and favorites are saved in your browser’s localStorage on this device. We have no server and no database, so we cannot see this data.'],
      ['Third-party services', 'The pose model and fonts are downloaded from Google’s servers (jsDelivr, Google Storage, Google Fonts). If you connect Spotify, you log in on Spotify’s own website and the app receives a temporary access token stored in this browser’s session storage.'],
      ['Your control', 'You can export, import or delete all data at any time in Settings → Your data. Disconnecting Spotify removes its token.'],
      ['Health notice', 'PRIME FORM gives general exercise guidance and is not medical advice. Stop exercising and consult a professional if you feel pain, dizziness or shortness of breath.'],
    ],
  },

  onboarding: {
    welcome: 'Welcome to PRIME FORM', welcomeSub: 'Your AI personal trainer. Let’s set up in 30 seconds.', lang: 'Choose your language',
    about: 'About you', aboutSub: 'Used for recommendations and calorie estimates. Stored only on this device.',
    goal: 'Your goal & level', finish: 'Let’s train', step: 'Step {a} of {b}', skip: 'Skip',
  },

  quick: {
    title: 'Quick tools', timer: 'Rest timer', start: 'Start', reset: 'Reset', tip: 'Coach tip', help: 'Help & FAQ', done: 'Rest is over — next set!',
    tips: [
      'Warm up for 5 minutes before heavy sets.', 'Exhale on the effort, inhale on the way back.', 'Quality first: slow reps build more control.',
      'Drink water between sets.', 'Sleep 7–9 hours — muscles grow while you rest.', 'Film your set from the side to check your posture.',
    ],
  },

  search: { ph: 'Search exercises, muscles, categories…', none: 'No matches', hint: 'Press Enter to open the first result · Esc to close' },
};
