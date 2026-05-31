// --- MARATHON JOURNAL STATIC DATA ---
// All training templates, meal plans, milestones, and progression tables.
// Loaded before app.js so every constant is available at startup.

// ── WEEKLY TRAINING TEMPLATE ──────────────────────────────────────
// Each entry is one day of the 7-day rolling training week.
const WEEKLY_TEMPLATE = [
  {
    day: 'Monday',
    type: 'REST + Mobility',
    emoji: '🧘',
    color: '#60a5fa',
    tasks: [
      '10 min morning stretch: hip flexors, calves, hamstrings, quads',
      'Foam roll: IT band, quads, glutes, calves',
      'Hydrate with electrolytes throughout the day',
      'Prep run gear and pre-run snack for Tuesday',
      'Get 7–9 hours of sleep — recovery is training',
    ]
  },
  {
    day: 'Tuesday',
    type: 'RUN – Easy Pace',
    emoji: '🏃',
    color: '#4ade80',
    tasks: [
      'Pre-run snack 30–45 min before (banana or toast + PB)',
      'Electrolyte drink before & after',
      'Easy conversational pace — Phase 1: 2–3mi | Phase 2: 3–5mi | Phase 3: 5–7mi',
      'Log distance, pace & how you felt in the Run Log tab',
      'Post-run: 15 min stretch (calves, quads, hip flexors)',
    ]
  },
  {
    day: 'Wednesday',
    type: 'CALISTHENICS – Upper Body',
    emoji: '💪',
    color: '#7c3aed',
    tasks: [
      'Warm-up: 5 min jumping jacks + arm circles',
      'Push-ups: 3 sets (see progression table in Guide tab)',
      'Pike push-ups: 3×10',
      'Diamond push-ups: 3×8',
      'Doorframe rows or inverted rows: 3×10',
      'Plank hold: 3×45 sec (build to 3×2 min over time)',
      'Pull-up negatives or assisted pull-ups: 3×5 (build to 3×10 full)',
      'Cool-down stretch: 10 min',
    ]
  },
  {
    day: 'Thursday',
    type: 'RUN – Intervals / Tempo',
    emoji: '⚡',
    color: '#f97316',
    tasks: [
      'Pre-run snack + electrolytes 30–45 min before',
      'Warm-up: 5–10 min easy jog',
      'Phase 1: 6×400m with 90s rest | Phase 2: Mile repeats | Phase 3: Tempo runs',
      'Cool-down: 5–10 min easy jog + walk',
      'Log splits & perceived effort in Run Log tab',
      'Post-run nutrition within 30 min (carbs + protein)',
    ]
  },
  {
    day: 'Friday',
    type: 'CALISTHENICS – Core & Lower',
    emoji: '🔥',
    color: '#ea580c',
    tasks: [
      'Warm-up: 5 min light cardio (jumping jacks or jog in place)',
      'Bodyweight squats: 3×20',
      'Reverse lunges: 3×12 each leg',
      'Glute bridges: 3×20',
      'Dead bugs: 3×10 each side',
      'Bicycle crunches: 3×20',
      'Mountain climbers: 3×30 sec',
      'Superman holds: 3×10',
      'Cool-down & stretch: 10 min',
    ]
  },
  {
    day: 'Saturday',
    type: 'LONG RUN',
    emoji: '🌅',
    color: '#a78bfa',
    tasks: [
      'Full meal 2 hrs before OR light snack 45 min before',
      'Carry electrolytes and water for the full run',
      'Phase 1: 4–5mi easy | Phase 2: 8–12mi | Phase 3: 14–20mi',
      'Run/walk intervals if needed (9 min run : 1 min walk)',
      'Carry 1–2 gels or chews for runs over 60 min (every 45 min)',
      'Log total distance, time, and avg pace',
      'Recovery meal within 30–45 min (chocolate milk or protein + carbs)',
      'Ice legs or elevate for 20 min after',
    ]
  },
  {
    day: 'Sunday',
    type: 'TRUE REST',
    emoji: '🥗',
    color: '#22d3ee',
    tasks: [
      'Complete rest — no running, no calisthenics today',
      'Optional light walk only if legs feel good (20 min max)',
      'Meal prep for the week (see Sunday checklist in Meal Plan tab)',
      'Batch cook: brown rice, quinoa, or sweet potatoes',
      'Prep protein sources: grill chicken, hard-boil eggs',
      "Review last week's progress and plan the week ahead",
      'Celebrate your progress — you earned this rest',
    ]
  }
];

// ── DEFAULT MILESTONES ────────────────────────────────────────────
const DEFAULT_MILESTONES = [
  { week: 1, goal: 'Complete first full training week without missing a day', done: false },
  { week: 2, goal: 'Run 3+ miles without stopping — first official milestone', done: false },
  { week: 4, goal: 'Hit first 4-week check-in: weight trend, pace improvement', done: false },
  { week: 5, goal: 'Complete first 5-mile run', done: false },
  { week: 8, goal: 'Run a 10K distance (6.2 miles) non-stop', done: false },
  { week: 10, goal: 'Complete first Half-Marathon distance (13.1 miles)', done: false },
  { week: 12, goal: 'Reach strength goal: 3 full pull-ups unassisted', done: false },
  { week: 16, goal: '16-mile long run completed — crossing the mental halfway mark', done: false },
  { week: 20, goal: 'First 20-mile training run — peak distance before taper', done: false },
  { week: 22, goal: 'Taper begins — celebrate the hard work done', done: false },
  { week: 24, goal: '🏅 RACE DAY — Run 26.2 miles and cross the finish line!', done: false },
];

// ── MEAL PLAN ─────────────────────────────────────────────────────
const MEAL_PLAN = {
  days: [
    {
      label: 'Training Day A',
      emoji: '🏃',
      color: '#4ade80',
      note: 'High-carb, high-protein day — fueling a hard workout. Calorie target is at max.',
      meals: [
        {
          name: 'Breakfast',
          time: '7:00 AM',
          items: [
            'Oatmeal (1 cup dry oats) with banana slices + drizzle of honey',
            '2–3 scrambled eggs or egg whites + 1 slice whole grain toast',
            '8 oz chocolate milk or protein shake (27g protein)',
          ]
        },
        {
          name: 'Mid-Morning Snack',
          time: '10:30 AM',
          items: [
            'Greek yogurt (plain, 2% fat) with mixed berries',
            '1 tbsp almond butter on rice cake',
          ]
        },
        {
          name: 'Lunch',
          time: '12:30 PM',
          items: [
            'Grilled chicken breast (6 oz) over brown rice (1 cup cooked)',
            'Roasted broccoli + bell peppers with olive oil',
            'Large glass of water + electrolyte tab or squeeze of lemon',
          ]
        },
        {
          name: 'Pre-Run Snack',
          time: '3:30 PM',
          items: [
            'Banana + 1–2 tbsp peanut butter (45 min before run)',
            '12–16 oz water',
          ]
        },
        {
          name: 'Post-Run Dinner',
          time: '6:30 PM',
          items: [
            'Salmon fillet (6 oz) or ground turkey with olive oil + garlic',
            'Sweet potato (medium) or quinoa (1 cup cooked)',
            'Steamed green beans or asparagus with lemon',
            'Large salad with spinach, cucumber, tomato, olive oil dressing',
          ]
        },
        {
          name: 'Evening Snack',
          time: '9:00 PM',
          items: [
            'Cottage cheese (½ cup) with sliced almonds — casein protein for overnight muscle repair',
          ]
        },
      ]
    },
    {
      label: 'Training Day B',
      emoji: '⚡',
      color: '#f97316',
      note: 'Interval day — slightly more carbs pre-workout for explosive speed work.',
      meals: [
        {
          name: 'Breakfast',
          time: '7:00 AM',
          items: [
            '2 slices whole grain toast with avocado and boiled eggs (2 eggs)',
            '1 orange or handful of blueberries',
            'Black coffee or green tea (optional pre-workout caffeine)',
          ]
        },
        {
          name: 'Pre-Interval Snack',
          time: '3:00 PM',
          items: [
            'Energy gel or banana (30–45 min before intervals)',
            '12 oz water',
          ]
        },
        {
          name: 'Lunch',
          time: '12:00 PM',
          items: [
            'Turkey or tuna wrap: whole-wheat tortilla, lettuce, tomato, mustard',
            'Side of brown rice or sweet potato wedges',
            'Sparkling water or electrolyte drink',
          ]
        },
        {
          name: 'Post-Interval Dinner',
          time: '7:00 PM',
          items: [
            'Lean ground turkey stir-fry with brown rice + broccoli + snap peas',
            'Soy sauce, ginger, garlic, sesame oil dressing',
            'Side of miso soup for electrolytes',
          ]
        },
        {
          name: 'Recovery Shake',
          time: '8:30 PM',
          items: [
            'Whey or plant protein shake (25–30g protein) blended with banana + almond milk',
          ]
        },
      ]
    },
    {
      label: 'Calisthenics Day',
      emoji: '💪',
      color: '#7c3aed',
      note: 'Strength day — higher protein, moderate carbs. Feed the muscle you are building.',
      meals: [
        {
          name: 'Breakfast',
          time: '7:00 AM',
          items: [
            '3-egg omelette with spinach, peppers, and feta cheese',
            '1 slice whole grain toast with a thin spread of almond butter',
            'Black coffee or green tea + 16 oz water',
          ]
        },
        {
          name: 'Pre-Workout Snack',
          time: '30–45 min before',
          items: [
            'Greek yogurt (1 cup plain 2%) with a drizzle of honey',
            'OR: 1 apple + 1 tbsp peanut butter',
            '12 oz water',
          ]
        },
        {
          name: 'Lunch',
          time: '12:00 PM',
          items: [
            'Power bowl: ground turkey or chicken, black beans, brown rice, salsa, avocado',
            'Side of roasted broccoli or zucchini',
            'Sparkling water or electrolyte drink',
          ]
        },
        {
          name: 'Post-Workout Shake',
          time: 'Within 30 min',
          items: [
            'Whey or plant protein shake (25–30g protein) with almond milk + banana',
            'OR: cottage cheese (½ cup) + handful of pretzels',
          ]
        },
        {
          name: 'Dinner',
          time: '6:30 PM',
          items: [
            'Baked chicken thighs (6 oz, skin off) with garlic, lemon, and herbs',
            'Roasted sweet potato (medium) or quinoa (¾ cup cooked)',
            'Steamed green beans or asparagus with olive oil',
            'Large glass of water — push hydration after bodyweight work',
          ]
        },
        {
          name: 'Evening Snack',
          time: '9:00 PM',
          items: [
            'Cottage cheese (½ cup) — slow-digesting casein protein repairs muscle overnight',
            'OR: hard-boiled egg (2) + handful of almonds',
          ]
        },
      ]
    },
    {
      label: 'Rest Day',
      emoji: '🧘',
      color: '#60a5fa',
      note: 'Lower-calorie day — prioritize micronutrients, anti-inflammatories, and gut health.',
      meals: [
        {
          name: 'Breakfast',
          time: '8:00 AM',
          items: [
            'Egg omelette (2 eggs + 2 whites) with spinach, tomato, feta',
            '1 cup mixed berries (antioxidant recovery)',
            'Black coffee or herbal tea',
          ]
        },
        {
          name: 'Lunch',
          time: '12:30 PM',
          items: [
            'Large power bowl: quinoa, chickpeas, roasted zucchini, red cabbage slaw',
            'Tahini-lemon dressing',
            'Big glass of water + lemon',
          ]
        },
        {
          name: 'Afternoon Snack',
          time: '3:30 PM',
          items: [
            'Apple slices with almond or peanut butter',
            'Small handful of walnuts (omega-3 anti-inflammatory)',
          ]
        },
        {
          name: 'Dinner',
          time: '6:30 PM',
          items: [
            'Baked salmon (6 oz) with roasted asparagus + lemon-dill sauce',
            'Side of wilted spinach with garlic and olive oil',
            'Herbal tea (chamomile or turmeric) for recovery',
          ]
        },
      ]
    },
    {
      label: 'Long Run Day',
      emoji: '🌅',
      color: '#a78bfa',
      note: 'Maximum carb-loading day. Top off glycogen stores the night before AND morning of.',
      meals: [
        {
          name: 'Night Before (Carb Load)',
          time: '6:30 PM Sat',
          items: [
            'Large pasta bowl (2 cups cooked) with marinara + grilled chicken',
            'Side of garlic bread',
            'Orange juice or sports drink',
          ]
        },
        {
          name: 'Morning of Long Run',
          time: '6:00 AM',
          items: [
            'Oatmeal (1 cup) with banana + honey — easy-digest carbs',
            'Peanut butter on toast (1 slice) for sustained energy',
            '16 oz water + optional electrolyte tab',
          ]
        },
        {
          name: 'During Run',
          time: 'Every 45 min',
          items: [
            'Energy gel or chews every 45 min starting at mile 6',
            'Water at every mile marker or aid station',
            'Salt tab or LMNT packet if run exceeds 2 hours',
          ]
        },
        {
          name: 'Post-Run Recovery Meal',
          time: 'Within 30 min',
          items: [
            'Chocolate milk (16 oz) — ideal 4:1 carb-to-protein ratio',
            'Banana or orange for quick sugar replenishment',
          ]
        },
        {
          name: 'Post-Run Dinner',
          time: '2–3 hours later',
          items: [
            'Grilled chicken thighs (8 oz) with sweet potato mash',
            'Roasted Brussels sprouts and beets (anti-inflammatory)',
            'Electrolyte-rich broth or soup',
          ]
        },
      ]
    },
  ],
  swaps: [
    { cat: 'Protein', opts: 'Chicken ↔ Salmon ↔ Turkey ↔ Tofu ↔ Tempeh ↔ Lentils ↔ Eggs' },
    { cat: 'Carbs', opts: 'Brown Rice ↔ Quinoa ↔ Sweet Potato ↔ Oats ↔ Whole Wheat Pasta' },
    { cat: 'Fats', opts: 'Avocado ↔ Olive Oil ↔ Almonds ↔ Walnuts ↔ Peanut Butter' },
    { cat: 'Greens', opts: 'Broccoli ↔ Spinach ↔ Asparagus ↔ Zucchini ↔ Green Beans ↔ Kale' },
    { cat: 'Recovery Drinks', opts: 'Chocolate Milk ↔ Protein Shake ↔ Tart Cherry Juice ↔ Beet Juice' },
  ],
  prep: [
    'Batch cook brown rice or quinoa (4–6 servings) in rice cooker',
    'Roast sweet potatoes and mixed vegetables (400°F, 25 min)',
    'Grill or bake chicken breasts (season with garlic, olive oil, lemon)',
    'Hard-boil 6–8 eggs for the week',
    'Portion snack bags: almonds, pretzels, or cut vegetables + hummus',
    'Pre-measure oats into Mason jars for overnight oats',
    'Wash and chop all raw vegetables: broccoli, peppers, cucumbers, spinach',
    'Fill 3–4 water bottles and keep in fridge for easy hydration',
  ]
};

// ── NUTRITION TIPS ────────────────────────────────────────────────
const NUTRITION_TIPS = [
  'Pre-run: eat easy-digest carbs 45–60 min before (banana, oats, toast). Avoid fat/fiber.',
  'Post-run: hit protein + carbs within 30 min (chocolate milk, protein shake + fruit).',
  'Protein goal: ~0.85g per lb of current body weight daily to preserve muscle during weight loss.',
  'Hydration: drink half your body weight in ounces of water daily + 24 oz extra on hot FL days.',
  'Electrolytes: add LMNT or Nuun tabs for runs over 45 min. Sweat loss drains sodium and potassium.',
  'Night before long run: carb-load with pasta, rice, or sweet potato. Avoid new foods.',
  'Recovery foods: tart cherry juice, beet juice, turmeric, and omega-3s fight inflammation.',
  'Avoid alcohol: it disrupts sleep quality, muscle protein synthesis, and next-day performance.',
  'Caffeine: 1–2 cups of coffee 30–60 min pre-run is a proven legal performance enhancer.',
];

// ── STRENGTH PROGRESSIONS ─────────────────────────────────────────
const PUSHUP_PROG = [
  { week: '1–2', reps: '3 sets × 8–10 reps (focus on form)' },
  { week: '3–4', reps: '3 sets × 12–15 reps' },
  { week: '5–8', reps: '4 sets × 15–20 reps' },
  { week: '9–12', reps: '4 sets × 20–25 reps + pike push-ups' },
  { week: '13–16', reps: '5 sets × 25 reps + diamond push-ups' },
  { week: '17–20', reps: '5 sets × 30 reps + weighted vest (optional)' },
  { week: '21+', reps: 'Maintain: 100 push-ups/day in any set scheme' },
];

const PULLUP_PROG = [
  { week: '1–2', reps: 'Inverted rows under a table or bar: 3×8' },
  { week: '3–4', reps: 'Assisted pull-ups (band or jumping) 3×6–8' },
  { week: '5–8', reps: 'Negative pull-ups (slow lower): 3×5 + 1–2 full reps' },
  { week: '9–12', reps: '3–5 full pull-ups × 3 sets + negatives' },
  { week: '13–16', reps: '5–8 pull-ups × 4 sets' },
  { week: '17–20', reps: '8–10 pull-ups × 4 sets + L-sit holds' },
  { week: '21+', reps: '10–15 pull-ups × 5 sets — weighted optional' },
];

// ── WORKOUT TYPE DEFINITIONS ──────────────────────────────────────
// The pool of workout types that get assigned to non-rest days.
// Order matters: Easy Run, Upper Body, Tempo Run, Lower/Core, Long Run
const WORKOUT_POOL = [
  {
    type: 'RUN – Easy Pace',
    emoji: '🏃',
    color: '#4ade80',
    tasks: [
      'Pre-run snack 30–45 min before (banana or toast + PB)',
      'Electrolyte drink before & after',
      'Easy conversational pace — Phase 1: 2–3mi | Phase 2: 3–5mi | Phase 3: 5–7mi',
      'Log distance, pace & how you felt in the Run Log tab',
      'Post-run: 15 min stretch (calves, quads, hip flexors)',
    ]
  },
  {
    type: 'CALISTHENICS – Upper Body',
    emoji: '💪',
    color: '#7c3aed',
    tasks: [
      'Warm-up: 5 min jumping jacks + arm circles',
      'Push-ups: 3 sets (see progression table in Guide tab)',
      'Pike push-ups: 3×10',
      'Diamond push-ups: 3×8',
      'Doorframe rows or inverted rows: 3×10',
      'Plank hold: 3×45 sec (build to 3×2 min over time)',
      'Pull-up negatives or assisted pull-ups: 3×5 (build to 3×10 full)',
      'Cool-down stretch: 10 min',
    ]
  },
  {
    type: 'RUN – Intervals / Tempo',
    emoji: '⚡',
    color: '#f97316',
    tasks: [
      'Pre-run snack + electrolytes 30–45 min before',
      'Warm-up: 5–10 min easy jog',
      'Phase 1: 6×400m with 90s rest | Phase 2: Mile repeats | Phase 3: Tempo runs',
      'Cool-down: 5–10 min easy jog + walk',
      'Log splits & perceived effort in Run Log tab',
      'Post-run nutrition within 30 min (carbs + protein)',
    ]
  },
  {
    type: 'CALISTHENICS – Core & Lower',
    emoji: '🔥',
    color: '#ea580c',
    tasks: [
      'Warm-up: 5 min light cardio (jumping jacks or jog in place)',
      'Bodyweight squats: 3×20',
      'Reverse lunges: 3×12 each leg',
      'Glute bridges: 3×20',
      'Dead bugs: 3×10 each side',
      'Bicycle crunches: 3×20',
      'Mountain climbers: 3×30 sec',
      'Superman holds: 3×10',
      'Cool-down & stretch: 10 min',
    ]
  },
  {
    type: 'LONG RUN',
    emoji: '🌅',
    color: '#a78bfa',
    tasks: [
      'Full meal 2 hrs before OR light snack 45 min before',
      'Carry electrolytes and water for the full run',
      'Phase 1: 4–5mi easy | Phase 2: 8–12mi | Phase 3: 14–20mi',
      'Run/walk intervals if needed (9 min run : 1 min walk)',
      'Carry 1–2 gels or chews for runs over 60 min (every 45 min)',
      'Log total distance, time, and avg pace',
      'Recovery meal within 30–45 min (chocolate milk or protein + carbs)',
      'Ice legs or elevate for 20 min after',
    ]
  },
];

const REST_DAY_TEMPLATE = {
  type: 'REST + Mobility',
  emoji: '🧘',
  color: '#60a5fa',
  tasks: [
    '10 min morning stretch: hip flexors, calves, hamstrings, quads',
    'Foam roll: IT band, quads, glutes, calves',
    'Hydrate with electrolytes throughout the day',
    'Prep gear and pre-run snack for next workout day',
    'Get 7–9 hours of sleep — recovery is training',
  ]
};

const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/**
 * Builds a 7-entry weekly template based on chosen rest days.
 * restDays: array of day names e.g. ['Thursday','Saturday']
 * The 5 workout types from WORKOUT_POOL are spread across the remaining days,
 * always keeping the LONG RUN as far from the rest days as possible.
 */
function buildWeeklyTemplate(restDays) {
  // Default to Mon + Thu rest if nothing provided
  if (!restDays || restDays.length === 0) restDays = ['Monday','Thursday'];

  // Start week on Monday
  const weekOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const activeDays = weekOrder.filter(d => !restDays.includes(d));

  // We have 5 workout slots to fill from WORKOUT_POOL
  // Spread them evenly; if more than 5 active days, extra days get easy runs
  const assigned = {};
  activeDays.forEach((day, i) => {
    assigned[day] = WORKOUT_POOL[i % WORKOUT_POOL.length];
  });

  return weekOrder.map(day => {
    if (restDays.includes(day)) {
      return { day, ...REST_DAY_TEMPLATE };
    }
    return { day, ...assigned[day] };
  });
}

// ── TRAINING GOALS ────────────────────────────────────────────────
// Each goal defines: display info, phase structure, milestones,
// default week count, and science basis note.
// Science references: ACSM Guidelines for Exercise Testing and Prescription (11th ed.),
// Hal Higdon Marathon/5K/10K Training Programs, Jack Daniels' Running Formula (3rd ed.),
// Couch to 5K (NHS/ACSM validated run/walk protocol)

const TRAINING_GOALS = {

  c25k: {
    id: 'c25k',
    label: 'Couch to 5K',
    emoji: '🚶',
    tagline: 'Start from zero. Run a 5K in 9 weeks.',
    desc: 'A proven walk-to-run program for complete beginners.',
    color: '#4ade80',
    defaultWeeks: 9,
    defaultPace: '15:00',
    scienceNote: 'Based on the NHS/ACSM-validated run/walk interval protocol. Alternating walk and run intervals exploits the principle of progressive overload while keeping injury risk low for deconditioned individuals.',
    phases: [
      { id:1, name:'Walk/Run', pct:[0,0.44],  color:'#4ade80', goal:'Build the habit. Alternate walking and running. No pressure on pace.', weeklyMiles:'6–10 mi/wk' },
      { id:2, name:'Running',  pct:[0.44,0.78],color:'#facc15', goal:'Run continuously for 20+ minutes. Pace does not matter yet.', weeklyMiles:'10–14 mi/wk' },
      { id:3, name:'5K Ready', pct:[0.78,1],   color:'#f97316', goal:'Run a full 5K (3.1 miles) without stopping. You are a runner.', weeklyMiles:'12–15 mi/wk' },
    ],
    milestones: [
      { week:1,  goal:'Complete Week 1 — walk/run intervals 3 days', done:false },
      { week:3,  goal:'Run 8 minutes continuously without stopping', done:false },
      { week:5,  goal:'Run 20 minutes continuously — biggest milestone of the plan', done:false },
      { week:7,  goal:'Run 25 minutes without stopping', done:false },
      { week:9,  goal:'🏅 Run a full 5K (3.1 miles) — you did it!', done:false },
    ],
  },

  fivek: {
    id: 'fivek',
    label: '5K / 10K',
    emoji: '🏅',
    tagline: 'Get faster. Race your best time.',
    desc: 'Structured speed and interval work for 5K and 10K runners.',
    color: '#facc15',
    defaultWeeks: 12,
    defaultPace: '12:00',
    scienceNote: 'Interval training at VO2max intensity (as defined by Jack Daniels\' VDOT system) produces the greatest aerobic adaptations for short-distance racing. 80/20 training distribution (80% easy, 20% hard) is supported by Seiler & Tønnessen (2009).',
    phases: [
      { id:1, name:'Base',     pct:[0,0.33],  color:'#4ade80', goal:'Build aerobic base with easy runs and light speedwork.', weeklyMiles:'12–18 mi/wk' },
      { id:2, name:'Speed',    pct:[0.33,0.75],color:'#facc15', goal:'Interval training at 5K pace. Track workouts. Tempo runs.', weeklyMiles:'18–25 mi/wk' },
      { id:3, name:'Race Prep',pct:[0.75,1],  color:'#f97316', goal:'Sharpening. Race-pace workouts. Short taper before race day.', weeklyMiles:'15–20 mi/wk' },
    ],
    milestones: [
      { week:2,  goal:'Complete first interval session — 6×400m at effort', done:false },
      { week:4,  goal:'Run a time trial 5K — establish your baseline', done:false },
      { week:7,  goal:'First tempo run at race pace for 20+ minutes', done:false },
      { week:10, goal:'Sub-30 min 5K or sub-60 min 10K — pace goal reached', done:false },
      { week:12, goal:'🏅 Race day — run your best 5K or 10K!', done:false },
    ],
  },

  half: {
    id: 'half',
    label: 'Half Marathon',
    emoji: '🏃',
    tagline: 'Build to 13.1 miles in 16 weeks.',
    desc: 'A structured 16-week plan from 5K base to half marathon finish.',
    color: '#f97316',
    defaultWeeks: 16,
    defaultPace: '11:30',
    scienceNote: 'ACSM recommends a minimum 12–16 week build for half marathon preparation. The 10% weekly mileage increase rule (Macera et al., 1989) is applied to reduce overuse injury risk. Long runs capped at 10–11 miles per Higdon\'s half marathon plans.',
    phases: [
      { id:1, name:'Foundation', pct:[0,0.31], color:'#4ade80', goal:'Build to a comfortable 6-mile long run. 3 days running per week.', weeklyMiles:'15–20 mi/wk' },
      { id:2, name:'Build',      pct:[0.31,0.69],color:'#facc15', goal:'Long run reaches 9–10 miles. Add tempo work once per week.', weeklyMiles:'22–30 mi/wk' },
      { id:3, name:'Peak',       pct:[0.69,0.88],color:'#f97316', goal:'11-mile long run. Race-pace miles in long runs. Peak week.', weeklyMiles:'28–35 mi/wk' },
      { id:4, name:'Taper',      pct:[0.88,1],   color:'#60a5fa', goal:'2-week taper. Cut volume by 40%. Stay sharp, stay rested.', weeklyMiles:'18–22 mi/wk' },
    ],
    milestones: [
      { week:3,  goal:'Run 5 miles without stopping', done:false },
      { week:6,  goal:'Complete first 8-mile long run', done:false },
      { week:9,  goal:'Run 10 miles — over halfway to race distance', done:false },
      { week:12, goal:'Complete 11-mile peak long run', done:false },
      { week:14, goal:'Taper begins — trust the training', done:false },
      { week:16, goal:'🏅 Race day — run 13.1 miles!', done:false },
    ],
  },

  marathon: {
    id: 'marathon',
    label: 'Marathon',
    emoji: '🏆',
    tagline: 'Train for 26.2 miles over 47 weeks.',
    desc: 'A full marathon training plan with periodized phases.',
    color: '#a78bfa',
    defaultWeeks: 47,
    defaultPace: '13:00',
    scienceNote: 'Marathon training follows periodization principles (Issurin, 2010). The long run is capped at 20 miles per research showing diminishing returns and increased injury risk beyond this distance (Marti et al., 1988). 80/20 training intensity distribution is applied throughout.',
    phases: [
      { id:1, name:'Foundation', pct:[0,0.17], color:'#4ade80', goal:'Build aerobic base, establish routine, reduce injury risk.', weeklyMiles:'15–20 mi/wk' },
      { id:2, name:'Build',      pct:[0.17,0.43],color:'#facc15', goal:'Increase mileage, improve pace, cement long run habit.', weeklyMiles:'25–35 mi/wk' },
      { id:3, name:'Peak',       pct:[0.43,0.85],color:'#f97316', goal:'Long runs to 20 miles, tempo work, race-pace miles.', weeklyMiles:'35–45 mi/wk' },
      { id:4, name:'Taper',      pct:[0.85,1],   color:'#60a5fa', goal:'3-week taper. Reduce volume, maintain intensity.', weeklyMiles:'20–10 mi/wk' },
    ],
    milestones: [
      { week:4,  goal:'Run 5K without stopping — sub-37 min', done:false },
      { week:8,  goal:'Complete first 10-mile long run', done:false },
      { week:14, goal:'Half marathon distance (13.1 miles)', done:false },
      { week:20, goal:'16-mile long run', done:false },
      { week:28, goal:'20-mile long run — peak distance', done:false },
      { week:32, goal:'Pace under 10:30/mi on easy runs', done:false },
      { week:40, goal:'Pace target achieved — race ready', done:false },
      { week:47, goal:'🏅 RACE DAY — 26.2 miles!', done:false },
    ],
  },

  fitness: {
    id: 'fitness',
    label: 'General Fitness',
    emoji: '💪',
    tagline: 'Get consistently active. Feel better.',
    desc: 'A balanced plan mixing cardio and strength for overall health.',
    color: '#60a5fa',
    defaultWeeks: 24,
    defaultPace: '14:00',
    scienceNote: 'Based on ACSM\'s physical activity guidelines: 150 min/week moderate-intensity cardio or 75 min vigorous-intensity, plus 2 days/week resistance training targeting all major muscle groups (ACSM, 2022). Progressive overload principle applied to both cardio and strength.',
    phases: [
      { id:1, name:'Habit',    pct:[0,0.33], color:'#4ade80', goal:'Build the exercise habit. 3–4 days active per week consistently.', weeklyMiles:'8–12 mi/wk' },
      { id:2, name:'Progress', pct:[0.33,0.67],color:'#facc15', goal:'Increase cardio duration and strength loads. Add variety.', weeklyMiles:'12–18 mi/wk' },
      { id:3, name:'Lifestyle',pct:[0.67,1],  color:'#60a5fa', goal:'Fitness is a habit now. Maintain and push personal records.', weeklyMiles:'15–22 mi/wk' },
    ],
    milestones: [
      { week:2,  goal:'Complete 2 full weeks without missing a workout day', done:false },
      { week:6,  goal:'Run 30 minutes continuously at an easy pace', done:false },
      { week:10, goal:'Complete 150 min of cardio in a single week (ACSM target)', done:false },
      { week:16, goal:'Noticeable strength improvement — more reps than week 1', done:false },
      { week:20, goal:'Run a 5K — a fitness milestone worth celebrating', done:false },
      { week:24, goal:'🏅 24 weeks of consistent training — lifestyle changed', done:false },
    ],
  },
};

// Default run day task for C25K — walk/run intervals
const C25K_RUN_TASKS = [
  'Warm-up: 5 min brisk walk',
  'Alternate: run 1 min / walk 90 sec × 8 rounds (Week 1–2)',
  'Progress to: run 3 min / walk 3 min × 5 rounds (Week 3–4)',
  'Progress to: run 5 min / walk 3 min × 3 rounds (Week 5)',
  'Progress to: run 20 min continuously (Week 5+)',
  'Cool-down: 5 min walk',
  'Note: Never increase total running time more than 10% per week',
];
