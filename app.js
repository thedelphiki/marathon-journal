// --- MARATHON JOURNAL CENTRAL STATE & RENDERING ENGINE ---

// ── STATE ────────────────────────────────────────────────────────
const STORAGE_KEY = 'road2262_v1';

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return null;
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {}
}

let STATE = {
  tab: 'overview',
  week: 1,
  checkedTasks: {},
  milestones: [], // Initialized dynamically in render/init
  notes: {},
  runLog: [],
  logForm: {date:'', distance:'', time:'', notes:''},
  mealDay: 0,
  saveMsg: '',
};

// ── LOAD STATE ──
const saved = loadState();
if (saved) {
  if (saved.checkedTasks) STATE.checkedTasks = saved.checkedTasks;
  if (saved.milestones) STATE.milestones = saved.milestones;
  if (saved.notes) STATE.notes = saved.notes;
  if (saved.runLog) STATE.runLog = saved.runLog;
  if (saved.week) STATE.week = saved.week;
}

// Global persistence trigger (autosave)
function persist() {
  saveState({
    checkedTasks: STATE.checkedTasks,
    milestones: STATE.milestones,
    notes: STATE.notes,
    runLog: STATE.runLog,
    week: STATE.week
  });
  
  // Hook for Firebase Firestore Sync
  if (window.MarathonDB && typeof window.MarathonDB.syncToCloud === 'function') {
    window.MarathonDB.syncToCloud(STATE);
  }
}

// ── DYNAMIC SYSTEM CALCULATORS ──

// Returns phase configurations dynamically scaled based on custom training program weeks
function getDynamicPhases() {
  const profile = window.MarathonProfile ? window.MarathonProfile.state : {
    startDate: "2026-05-25",
    raceDate: "2027-04-12",
    climate: "south-fl"
  };

  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : { totalWeeks: 47 };
  const totalWeeks = metrics.totalWeeks;

  const fEnd = Math.max(1, Math.round(totalWeeks * 0.20));
  const bEnd = Math.max(fEnd + 1, Math.round(totalWeeks * 0.60));
  const pEnd = Math.max(bEnd + 1, Math.round(totalWeeks * 0.90));
  
  const startD = parseLocalDate(profile.startDate);
  
  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Calculate exact phase start/end dates
  const fStartD = new Date(startD);
  const bStartD = new Date(startD); bStartD.setDate(fStartD.getDate() + fEnd * 7);
  const pStartD = new Date(startD); pStartD.setDate(fStartD.getDate() + bEnd * 7);
  const tStartD = new Date(startD); tStartD.setDate(fStartD.getDate() + pEnd * 7);
  
  return [
    {
      id: 1, 
      name: "Foundation", 
      weeks: `Weeks 1–${fEnd}`, 
      dates: `${formatDate(fStartD)} – ${formatDate(new Date(bStartD.getTime() - 86400000))}`, 
      color: "#4ade80", 
      goal: "Build solid aerobic base, establish daily discipline, and prepare muscles for volume.", 
      weeklyMiles: "12–15 mi/wk",
      maxWeek: fEnd
    },
    {
      id: 2, 
      name: "Build", 
      weeks: `Weeks ${fEnd+1}–${bEnd}`, 
      dates: `${formatDate(bStartD)} – ${formatDate(new Date(pStartD.getTime() - 86400000))}`, 
      color: "#facc15", 
      goal: "Increase running volume, scale strength/calisthenics, and cement target pacing splits.", 
      weeklyMiles: "20–30 mi/wk",
      maxWeek: bEnd
    },
    {
      id: 3, 
      name: "Peak", 
      weeks: `Weeks ${bEnd+1}–${pEnd}`, 
      dates: `${formatDate(pStartD)} – ${formatDate(new Date(tStartD.getTime() - 86400000))}`, 
      color: "#f97316", 
      goal: "Achieve peak volume, run longest efforts (18–20 miles), and maximize calisthenics reps.", 
      weeklyMiles: "35–45 mi/wk",
      maxWeek: pEnd
    },
    {
      id: 4, 
      name: "Taper", 
      weeks: `Weeks ${pEnd+1}–${totalWeeks}`, 
      dates: `${formatDate(tStartD)} – ${formatDate(parseLocalDate(profile.raceDate))}`, 
      color: "#60a5fa", 
      goal: "Race-ready reduction. Sharpen target splits, recover muscles, and maximize carb loads.", 
      weeklyMiles: "20–10 mi/wk",
      maxWeek: totalWeeks
    }
  ];
}

function getPhase(w) {
  const phases = getDynamicPhases();
  if (w <= phases[0].maxWeek) return phases[0];
  if (w <= phases[1].maxWeek) return phases[1];
  if (w <= phases[2].maxWeek) return phases[2];
  return phases[3];
}

// Parses a YYYY-MM-DD date string as LOCAL time (not UTC) to avoid timezone day-shift
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

// Generates dynamic dates for the current active week
function getWeekDateRange(w) {
  const profile = window.MarathonProfile ? window.MarathonProfile.state : { startDate: "2026-05-25" };
  const start = parseLocalDate(profile.startDate);
  
  const wStart = new Date(start);
  wStart.setDate(start.getDate() + (w - 1) * 7);
  
  const wEnd = new Date(wStart);
  wEnd.setDate(wStart.getDate() + 6);
  
  const opt = { month: 'short', day: 'numeric' };
  return `${wStart.toLocaleDateString('en-US', opt)} – ${wEnd.toLocaleDateString('en-US', opt)}`;
}

// Calculate dynamic target mileage for a specific week based on progressive build-up and rest cycles
function getWeeklyTargetMileage(w, totalWeeks) {
  const fEnd = Math.max(1, Math.round(totalWeeks * 0.20));
  const bEnd = Math.max(fEnd + 1, Math.round(totalWeeks * 0.60));
  const pEnd = Math.max(bEnd + 1, Math.round(totalWeeks * 0.90));

  if (w <= fEnd) {
    // Foundation ramp: 10mi to 15mi
    const pct = w / fEnd;
    return Math.round(10 + (15 - 10) * pct);
  } else if (w <= bEnd) {
    // Build ramp: 15mi to 30mi
    const buildWeeks = bEnd - fEnd;
    const currentBuildIndex = w - fEnd;
    const pct = currentBuildIndex / buildWeeks;
    
    // Add a classic rest dip every 4th week
    if (currentBuildIndex % 4 === 0) {
      return Math.round((15 + (30 - 15) * pct) * 0.75); // 25% recovery reduction
    }
    return Math.round(15 + (30 - 15) * pct);
  } else if (w <= pEnd) {
    // Peak volume ramp: 30mi to 45mi
    const peakWeeks = pEnd - bEnd;
    const currentPeakIndex = w - bEnd;
    const pct = currentPeakIndex / peakWeeks;
    
    if (currentPeakIndex % 4 === 0) {
      return Math.round((30 + (45 - 30) * pct) * 0.75);
    }
    return Math.round(30 + (45 - 30) * pct);
  } else {
    // Taper ramp down: 30mi, 20mi, 10mi
    const taperWeeks = totalWeeks - pEnd;
    const currentTaperIndex = w - pEnd;
    const pct = currentTaperIndex / taperWeeks;
    return Math.round(30 - (30 - 10) * pct);
  }
}

// Dietary Swapper Engine (translates hardcoded recipes based on user profile)
function customizeMealItems(items) {
  const profile = window.MarathonProfile ? window.MarathonProfile.state : { diet: 'none' };
  const diet = profile.diet;
  if (diet === 'none') return items;
  
  return items.map(item => {
    let text = item;
    if (diet === 'vegetarian' || diet === 'vegan') {
      text = text.replace(/grilled chicken|chicken thighs|chicken/gi, "grilled Tofu / Tempeh");
      text = text.replace(/salmon|tilapia|lean ground turkey|ground turkey|tuna/gi, "Lentils / Edamame / Chickpeas");
      text = text.replace(/scrambled eggs|egg omelette|boiled eggs|eggs/gi, "Scrambled Tofu or Protein shake");
      if (diet === 'vegan') {
        text = text.replace(/greek yogurt|cottage cheese|yogurt/gi, "Vegan Almond/Coconut Yogurt");
        text = text.replace(/chocolate milk/gi, "Vegan Protein shake (Soy/Oat Milk)");
        text = text.replace(/whey/gi, "Pea/Hemp protein");
      }
    }
    if (diet === 'gluten-free') {
      text = text.replace(/whole grain toast|slices toast|slice toast|toast|bread/gi, "Gluten-Free toast or Sweet Potato");
      text = text.replace(/oatmeal|oats/gi, "Gluten-Free Oats or Quinoa flakes");
      text = text.replace(/pasta/gi, "Brown Rice / Quinoa pasta");
      text = text.replace(/pretzels/gi, "Gluten-Free crackers");
    }
    if (diet === 'keto') {
      text = text.replace(/brown rice|rice|sweet potato|quinoa|potatoes|orange|banana/gi, "Spinach / Avocado salad");
      text = text.replace(/oatmeal|oats/gi, "Chia seed pudding with almonds");
      text = text.replace(/honey|drizzle of honey/gi, "Stevia or skip sweetener");
      text = text.replace(/pasta/gi, "Zucchini noodles (zoodles) with olive oil");
      text = text.replace(/snack bags: almonds, pretzels/gi, "snack bags: almonds, walnuts, cheese cubes");
    }
    return text;
  });
}

// ── DYNAMIC WEEK SCHEDULE ──────────────────────────────────────────
// Generates a 7-day schedule based on the user's chosen rest days.
// Remaining days are filled with runs and calisthenics intelligently.

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DAY_TYPES = {
  rest: {
    type: 'REST + Mobility', emoji: '🧘', color: '#60a5fa',
    tasks: [
      '10 min morning stretch: hip flexors, calves, hamstrings, quads',
      'Foam roll: IT band, quads, glutes, calves',
      'Hydrate with electrolytes throughout the day',
      'Prep run gear and snack for your next run day',
      'Get 7–9 hours of sleep — recovery is training',
    ]
  },
  easyRun: {
    type: 'RUN – Easy Pace', emoji: '🏃', color: '#4ade80',
    tasks: [
      'Pre-run snack 30–45 min before (banana or toast + PB)',
      'Electrolyte drink before & after',
      'Easy conversational pace — Phase 1: 2–3mi | Phase 2: 3–5mi | Phase 3: 5–7mi',
      'Log distance, pace & how you felt in the Run Log tab',
      'Post-run: 15 min stretch (calves, quads, hip flexors)',
    ]
  },
  tempoRun: {
    type: 'RUN – Intervals / Tempo', emoji: '⚡', color: '#f97316',
    tasks: [
      'Pre-run snack + electrolytes 30–45 min before',
      'Warm-up: 5–10 min easy jog',
      'Phase 1: 6×400m with 90s rest | Phase 2: Mile repeats | Phase 3: Tempo runs',
      'Cool-down: 5–10 min easy jog + walk',
      'Log splits & perceived effort in Run Log tab',
      'Post-run nutrition within 30 min (carbs + protein)',
    ]
  },
  longRun: {
    type: 'LONG RUN', emoji: '🌅', color: '#a78bfa',
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
  upperBody: {
    type: 'CALISTHENICS – Upper Body', emoji: '💪', color: '#7c3aed',
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
  lowerCore: {
    type: 'CALISTHENICS – Core & Lower', emoji: '🔥', color: '#ea580c',
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
  trueRest: {
    type: 'TRUE REST', emoji: '🥗', color: '#22d3ee',
    tasks: [
      'Complete rest — no running, no calisthenics today',
      'Optional light walk only if legs feel good (20 min max)',
      'Meal prep for the week (see Meals tab for the Sunday checklist)',
      'Batch cook: brown rice, quinoa, or sweet potatoes',
      'Prep protein sources: grill chicken, hard-boil eggs',
      "Review last week's progress and plan the week ahead",
      'Celebrate your progress — you earned this rest',
    ]
  }
};

function generateWeekSchedule() {
  const profile     = window.MarathonProfile ? window.MarathonProfile.state : {};
  const restDays    = (profile.restDays    && profile.restDays.length)    ? profile.restDays    : ['Thursday','Saturday'];
  const runDays     = (profile.runDays     && profile.runDays.length)     ? profile.runDays     : ['Tuesday','Wednesday','Sunday'];
  const workoutDays = (profile.workoutDays && profile.workoutDays.length) ? profile.workoutDays : ['Monday','Friday'];

  const assignments = {};
  ALL_DAYS.forEach(d => { assignments[d] = 'rest'; });

  // Assign run types — last run day gets long run, second-to-last gets tempo, rest get easy
  const sortedRun = ALL_DAYS.filter(d => runDays.includes(d));
  sortedRun.forEach((d, i) => {
    if (i === sortedRun.length - 1) assignments[d] = 'longRun';
    else if (i === sortedRun.length - 2 && sortedRun.length > 1) assignments[d] = 'tempoRun';
    else assignments[d] = 'easyRun';
  });

  // Assign calisthenics — alternate upper/lower body
  const sortedWork = ALL_DAYS.filter(d => workoutDays.includes(d));
  sortedWork.forEach((d, i) => { assignments[d] = i % 2 === 0 ? 'upperBody' : 'lowerCore'; });

  // Rest days override everything
  restDays.forEach(d => { assignments[d] = 'rest'; });

  return ALL_DAYS.map(dayName => {
    const typeKey = assignments[dayName] || 'rest';
    return { day: dayName, typeKey, ...DAY_TYPES[typeKey] };
  });
}

// Get the current week's schedule (cached per render)
function getWeekSchedule() {
  return generateWeekSchedule();
}

// ── TASK STATE HELPERS (updated to use dynamic schedule) ──────────
function isChecked(di, ti) {
  return !!STATE.checkedTasks[`w${STATE.week}-d${di}-t${ti}`];
}

function getDayProg(di) {
  const schedule = getWeekSchedule();
  const t = schedule[di].tasks;
  const d = t.filter((_, ti) => isChecked(di, ti)).length;
  return {d, t: t.length};
}

function getWeekPct() {
  const schedule = getWeekSchedule();
  let d = 0, t = 0;
  schedule.forEach((day, di) => day.tasks.forEach((_, ti) => {
    t++;
    if (isChecked(di, ti)) d++;
  }));
  return t > 0 ? Math.round((d / t) * 100) : 0;
}

// ── HTML BUILDERS ──
function card(content, extra = '') {
  return `<div class="hover-card" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);${extra}">${content}</div>`;
}

function sectionTitle(text, color = '#4ade80') {
  return `<div style="font-size:13px;letter-spacing:0.08em;font-weight:bold;text-transform:uppercase;color:${color};margin-bottom:14px">${text}</div>`;
}

function arrow(color = '#4ade80') {
  return `<span style="color:${color};font-size:11px;margin-top:3px;flex-shrink:0">→</span>`;
}

// Renders dynamic biometrics and training paces computed in real-time
function renderOverview() {
  const p = getPhase(STATE.week);
  const profile = window.MarathonProfile ? window.MarathonProfile.state : { name: "Runner", weight: 220, targetWeight: 185 };
  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : { caloriesActive: 2300, caloriesRest: 1800, easyPace: "13:00", tempoPace: "9:40", intervalPace: "9:10" };
  const phases = getDynamicPhases();
  
  const stats = [
    {l:'Starting Weight',v:`${profile.weight} lbs`,s:`Goal: ~${profile.targetWeight} lbs`},
    {l:'Current Easy Pace',v:`${metrics.easyPace}/mi`,s:`Interval: ~${metrics.intervalPace}`},
    {l:'Target Race Pace',v:`${metrics.raceGoalPace}/mi`,s:`Tempo: ~${metrics.tempoPace}`}
  ];

  let html = `<h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin-bottom:18px">Biometrics & Pacing Target</h2>`;
  
  // Stat Grid
  html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">`;
  stats.forEach(s => {
    html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:14px 12px;text-align:center"><div style="font-size:10px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">${s.l}</div><div style="font-size:18px;color:#f8fafc;font-weight:bold;">${s.v}</div><div style="font-size:11px;color:#475569;margin-top:4px">${s.s}</div></div>`;
  });
  html += `</div>`;

  // Dynamic Weather Hydration Warning Card
  html += renderWeatherWidget(profile.climate, metrics.waterTargetOz);

  // SVG Weekly Mileage Progression Chart
  html += renderMileageChart(metrics.totalWeeks);

  // Dynamic Phase Lists
  html += `<h3 style="color:#94a3b8;font-weight:normal;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:24px 0 12px">Training Program Phases</h3>`;
  phases.forEach(ph => {
    const active = STATE.week <= ph.maxWeek && (ph.id === 1 || STATE.week > phases[ph.id - 2].maxWeek);
    html += `<div style="background:${active ? ph.color + '11' : '#0f172a'};border:1px solid ${active ? ph.color + '33' : '#1e293b'};border-left:3px solid ${ph.color};border-radius:10px;padding:14px 16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center"><div><span style="color:${ph.color};font-size:15px;font-weight:bold;">Phase ${ph.id}: ${ph.name}</span><span style="color:#475569;font-size:12px;margin-left:10px">${ph.weeks} · ${ph.dates}</span></div><span style="font-size:11px;color:#475569">${ph.weeklyMiles}</span></div><div style="font-size:13px;color:#94a3b8;margin-top:6px">${ph.goal}</div></div>`;
  });

  return html;
}

// Render local climate and hydration advice based on location profile
function renderWeatherWidget(climate, waterOz) {
  let cardColor = "rgba(59, 130, 246, 0.05)";
  let borderColor = "rgba(59, 130, 246, 0.2)";
  let badgeColor = "#60a5fa";
  let alertTitle = "Standard Hydration Alert";
  let description = `Drink at least <strong>${waterOz} oz</strong> of water daily to maintain performance and speed up cell recovery.`;

  if (climate === "south-fl") {
    cardColor = "rgba(234, 88, 12, 0.05)";
    borderColor = "rgba(234, 88, 12, 0.2)";
    badgeColor = "#f97316";
    alertTitle = "South Florida Heat & Humidity Alert ⚠️";
    description = `Summer index is active. Target <strong>${waterOz} oz</strong> of water daily + electrolyte replenishment. Add a pinch of salt + lime to morning bottles. Carry 1 Nuun/LMNT packet for runs > 45 mins. Avoid fasted runs in high midday heat.`;
  } else if (climate === "cold") {
    cardColor = "rgba(148, 163, 184, 0.05)";
    borderColor = "rgba(148, 163, 184, 0.2)";
    badgeColor = "#cbd5e1";
    alertTitle = "Cold Weather Hydration Notice";
    description = `Target <strong>${waterOz} oz</strong> of fluids. You lose moisture rapidly via breathing in cold air, though you feel less thirsty. Hydrate consistently.`;
  }

  return `
    <div style="background:${cardColor};border:1px solid ${borderColor};border-radius:12px;padding:16px;margin-bottom:24px;display:flex;gap:14px;align-items:flex-start;">
      <span style="font-size:32px;line-height:1;">🔥</span>
      <div>
        <span style="font-size:10px;background:${badgeColor}22;color:${badgeColor};border:1px solid ${badgeColor}33;padding:2px 8px;border-radius:20px;text-transform:uppercase;font-weight:bold;">${alertTitle}</span>
        <p style="font-size:13px;color:#94a3b8;line-height:1.5;margin-top:8px;">${description}</p>
      </div>
    </div>
  `;
}

// Dynamic Responsive SVG Mileage progression bar graph
function renderMileageChart(totalWeeks) {
  const phases = getDynamicPhases();
  
  const chartHeight = 120;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 20;
  
  const width = 600;
  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  
  const barWidth = Math.max(2, (innerWidth / totalWeeks) - 2);
  
  let maxMileage = 45; // Max scale cap
  
  // Calculate weekly heights
  let barsHtml = '';
  for (let w = 1; w <= totalWeeks; w++) {
    const activePhase = getPhase(w);
    const targetMiles = getWeeklyTargetMileage(w, totalWeeks);
    const pct = targetMiles / maxMileage;
    
    const barHeight = innerHeight * pct;
    const x = paddingLeft + (w - 1) * (innerWidth / totalWeeks);
    const y = paddingTop + (innerHeight - barHeight);
    
    const isActiveWeek = w === STATE.week;
    
    // Gradient coloring according to phase
    const color = activePhase.color;
    
    barsHtml += `
      <g style="cursor:pointer;" onclick="setWeek(${w})">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${color}" fill-opacity="${isActiveWeek ? '1' : '0.4'}" stroke="${isActiveWeek ? '#ffffff' : 'none'}" stroke-width="1.5">
          <title>Week ${w}: Target ${targetMiles} mi (${activePhase.name} Phase)</title>
        </rect>
        ${isActiveWeek ? `
          <line x1="${x + barWidth/2}" y1="${paddingTop}" x2="${x + barWidth/2}" y2="${chartHeight - paddingBottom}" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,2"/>
        ` : ''}
      </g>
    `;
  }

  // Draw mileage scale indicators (left Y axis)
  const scaleLines = [15, 30, 45];
  let scaleHtml = '';
  scaleLines.forEach(miles => {
    const y = paddingTop + (innerHeight - (innerHeight * (miles / maxMileage)));
    scaleHtml += `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#1e293b" stroke-width="0.8" stroke-dasharray="4,4"/>
      <text x="24" y="${y + 4}" fill="#475569" font-size="9" text-anchor="end" font-family="monospace">${miles}</text>
    `;
  });

  return `
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:24px;">
      <div style="font-size:12px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px;display:flex;justify-content:space-between;">
        <span>📈 Weekly Mileage Progression Chart</span>
        <span style="color:#64748b;font-size:11px;">Tap bars to jump to weeks</span>
      </div>
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${chartHeight}" style="width:100%; min-width: 500px; display:block;">
          ${scaleHtml}
          ${barsHtml}
          <!-- X Axis label -->
          <text x="${paddingLeft + innerWidth/2}" y="${chartHeight - 4}" fill="#475569" font-size="10" text-anchor="middle">Weeks 1 to ${totalWeeks} (Dynamic Road to 26.2)</text>
          <text x="24" y="${chartHeight - paddingBottom + 12}" fill="#475569" font-size="9" text-anchor="end">Week</text>
        </svg>
      </div>
    </div>
  `;
}

// Collapsible daily checklists to reduce visual busyness
function renderWeekly() {
  const p = getPhase(STATE.week);
  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : {};
  const schedule = getWeekSchedule();

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <div>
      <h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin:0">Week ${STATE.week} Training</h2>
      <span style="font-size:12px;color:#475569">${getWeekDateRange(STATE.week)}</span>
    </div>
    <span style="font-size:12px;color:#94a3b8;background:${p.color}15;border:1px solid ${p.color}33;padding:4px 10px;border-radius:12px;">Phase: ${p.name}</span>
  </div>`;

  schedule.forEach((day, di) => {
    const pr = getDayProg(di);
    const done = pr.d === pr.t;

    const targetTasks = day.tasks.map(task => {
      let t = task;
      if (metrics.easyPace) {
        t = t.replace(/Phase 1: 2–3mi \| Phase 2: 3–5mi \| Phase 3: 5–7mi/gi, `Target Easy Pace: <strong>${metrics.easyPace}/mi</strong>`);
        t = t.replace(/Phase 1: 6×400m with 90s rest \| Phase 2: Mile repeats \| Phase 3: Tempo runs/gi, `Interval: <strong>${metrics.intervalPace}/mi</strong> | Tempo: <strong>${metrics.tempoPace}/mi</strong>`);
      }
      return t;
    });

    html += `
      <details style="background:${done ? 'rgba(74,222,128,0.02)' : '#0f172a'};border:1px solid ${done ? 'rgba(74,222,128,0.2)' : '#1e293b'};border-left:3px solid ${day.color};border-radius:10px;margin-bottom:12px;overflow:hidden;" ${di===0?'open':''}>
        <summary style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;list-style:none;outline:none;">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:20px">${day.emoji}</span>
            <div>
              <div style="font-size:12px;color:#64748b">${day.day}</div>
              <div style="font-size:14px;color:${day.color};font-weight:bold;">${day.type}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-size:12px;color:${done ? day.color : '#475569'};font-family:monospace">${pr.d}/${pr.t}</div>
            <span style="color:#475569;font-size:12px;">▼</span>
          </div>
        </summary>
        <div style="padding:12px 16px 14px;border-top:1px solid #1e293b;">
          ${targetTasks.map((task, ti) => {
            const chk = isChecked(di, ti);
            return `
              <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;cursor:pointer" onclick="toggleTask(${di},${ti})">
                <div style="width:18px;height:18px;border-radius:4px;border:1.5px solid ${chk ? day.color : '#334155'};background:${chk ? day.color : 'transparent'};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
                  ${chk ? `<span style="color:#0a0f1a;font-size:11px;font-weight:bold">✓</span>` : ''}
                </div>
                <span style="font-size:13px;color:${chk ? '#475569' : '#cbd5e1'};text-decoration:${chk ? 'line-through' : 'none'};line-height:1.5">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      </details>
    `;
  });

  const noteVal = (STATE.notes[STATE.week] || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-top:14px"><div style="font-size:12px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Week ${STATE.week} Journal Note</div><textarea id="weeknote" onchange="saveNote()" oninput="saveNote()" placeholder="How did this week go? Any pain, PRs, observations..." style="width:100%;min-height:80px;background:#0a0f1a;border:1px solid #1e293b;border-radius:6px;color:#e2e8f0;padding:10px 12px;font-size:13px;resize:vertical;box-sizing:border-box;font-family:Georgia,serif">${noteVal}</textarea></div>`;
  return html;
}

// Renders customized, calculated meal templates based on profile choices
function renderNutrition() {
  const day = MEAL_PLAN.days[STATE.mealDay];
  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : {};
  const profile = window.MarathonProfile ? window.MarathonProfile.state : { diet: 'none' };
  
  let html = `<h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin-bottom:4px">Personalized Nutrition Plan</h2>
  <p style="color:#475569;font-size:13px;margin-bottom:20px">Calculated targets and recipes matching your dietary rules.</p>`;
  
  // Custom Calculated Nutrition targets widget
  html += `
    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="border-right:1px solid #1e293b;padding-right:12px;">
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Training Day Calories</div>
        <div style="font-size:24px;color:#4ade80;font-weight:bold;margin-top:4px;">~${metrics.caloriesActive || '2400'} <span style="font-size:12px;color:#475569;font-weight:normal;">kcal</span></div>
      </div>
      <div>
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Daily Protein Target</div>
        <div style="font-size:24px;color:#facc15;font-weight:bold;margin-top:4px;">${metrics.proteinTarget || '150'} <span style="font-size:12px;color:#475569;font-weight:normal;">g</span></div>
      </div>
    </div>
  `;

  // day selector
  html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:20px">`;
  MEAL_PLAN.days.forEach((d, i) => {
    const active = i === STATE.mealDay;
    html += `<button onclick="setMealDay(${i})" style="background:${active ? d.color + '22' : '#0f172a'};border:1px solid ${active ? d.color : '#1e293b'};border-radius:8px;padding:10px 4px;text-align:center;transition:all 0.15s"><div style="font-size:16px;margin-bottom:2px">${d.emoji}</div><div style="font-size:11px;color:${active ? d.color : '#94a3b8'}">${d.label.split(' ')[0]}</div></button>`;
  });
  html += `</div>`;

  // active day
  html += `<div style="background:${day.color}11;border:1px solid ${day.color}33;border-radius:10px;padding:12px 16px;margin-bottom:16px"><span style="font-size:13px;color:${day.color}">💡 </span><span style="font-size:13px;color:#94a3b8">${day.note}</span></div>`;
  
  day.meals.forEach(meal => {
    // Dynamically customize meal items based on Diet profile
    const customizedItems = customizeMealItems(meal.items);

    html += `<div style="background:#0f172a;border:1px solid #1e293b;border-left:3px solid ${day.color};border-radius:10px;padding:14px 16px;margin-bottom:12px">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div style="font-size:14px;color:#f8fafc;font-weight:bold;">${meal.name}</div><div style="font-size:10px;color:${day.color};background:${day.color}18;border-radius:4px;padding:2px 8px;white-space:nowrap;margin-left:8px;font-family:monospace;">${meal.time}</div></div>`;
    customizedItems.forEach(item => { 
      html += `<div style="display:flex;gap:8px;margin-bottom:6px">${arrow(day.color)}<span style="font-size:13px;color:#cbd5e1;line-height:1.5">${item}</span></div>`; 
    });
    html += `</div>`;
  });

  // swaps
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:16px"><div style="font-size:13px;color:#f97316;margin-bottom:12px">🔄 Ingredient Mix & Match</div>`;
  MEAL_PLAN.swaps.forEach(s => { 
    // Customize swap options too!
    const customSwaps = customizeMealItems([s.opts])[0];
    html += `<div style="margin-bottom:10px"><div style="font-size:11px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">${s.cat}</div><div style="font-size:13px;color:#94a3b8">${customSwaps}</div></div>`; 
  });
  html += `</div>`;

  // prep
  html += `<div style="background:#0f172a;border:1px solid #4ade8033;border-left:3px solid #4ade80;border-radius:10px;padding:16px"><div style="font-size:13px;color:#4ade80;margin-bottom:12px">📦 Sunday Preparation Checklist</div>`;
  MEAL_PLAN.prep.forEach(t => { html += `<div style="display:flex;gap:8px;margin-bottom:8px">${arrow()}<span style="font-size:13px;color:#94a3b8;line-height:1.5">${t}</span></div>`; });
  html += `</div>`;
  return html;
}

function renderMilestones() {
  // Pull milestones dynamically
  if (STATE.milestones.length === 0) {
    STATE.milestones = DEFAULT_MILESTONES.map(m => ({...m}));
  }

  const done = STATE.milestones.filter(m => m.done).length;
  const pct = Math.round((done / STATE.milestones.length) * 100);
  
  let html = `<h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin-bottom:6px">Journey Milestones</h2>
  <p style="color:#475569;font-size:13px;margin-bottom:20px">Tap to check off goals as you conquer them.</p>`;
  
  STATE.milestones.forEach((m, i) => {
    html += `<div onclick="toggleMilestone(${i})" style="background:${m.done ? 'rgba(74,222,128,0.02)' : '#0f172a'};border:1px solid ${m.done ? '#4ade8066' : '#1e293b'};border-radius:10px;padding:14px 16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px">`;
    html += `<div style="width:20px;height:20px;border-radius:50%;flex-shrink:0;border:2px solid ${m.done ? '#4ade80' : '#334155'};background:${m.done ? '#4ade80' : 'transparent'};display:flex;align-items:center;justify-content:center">${m.done ? '<span style="color:#0a0f1a;font-size:11px;font-weight:bold">✓</span>' : ''}</div>`;
    html += `<div style="flex:1"><span style="font-size:11px;color:${m.done ? '#4ade80' : '#475569'};margin-right:8px">Week ${m.week}</span><span style="font-size:14px;color:${m.done ? '#94a3b8' : '#e2e8f0'};text-decoration:${m.done ? 'line-through' : 'none'}">${m.goal}</span></div></div>`;
  });
  
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-top:20px"><div style="font-size:13px;color:#4ade80;margin-bottom:8px">📊 Overall Progress</div><div style="display:flex;justify-content:space-between;font-size:13px;color:#94a3b8;margin-bottom:8px"><span>${done} of ${STATE.milestones.length} completed</span><span>${pct}%</span></div><div style="height:6px;background:#1e293b;border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:3px"></div></div></div>`;
  return html;
}

function calcPace(distance, timeStr) {
  if (!distance || !timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const totalSecs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  if (!totalSecs || !parseFloat(distance)) return null;
  const paceSecs = totalSecs / parseFloat(distance);
  const mins = Math.floor(paceSecs / 60);
  const secs = Math.round(paceSecs % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
}

function renderLog() {
  const iStyle = `width:100%;background:#0a0f1a;border:1px solid #1e293b;border-radius:6px;color:#e2e8f0;padding:8px 10px;font-size:13px;box-sizing:border-box;font-family:Georgia,serif`;
  const f = STATE.logForm;

  // Live pace preview
  const livePace = calcPace(f.distance, f.time);
  const pacePreview = livePace
    ? `<div style="background:#0a1f12;border:1px solid #4ade8033;border-radius:6px;padding:8px 12px;font-size:13px;color:#4ade80;text-align:center;margin-bottom:10px">⚡ Calculated pace: <strong>${livePace}</strong></div>`
    : '';

  let html = `<h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin-bottom:20px">Run Log</h2>`;
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:24px">`;
  html += `<div style="font-size:12px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:12px">Log a Run</div>`;
  html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">`;
  html += `<div><div style="font-size:11px;color:#475569;margin-bottom:4px">Date</div><input type="date" id="lf_date" value="${f.date}" oninput="updateLogForm('date',this.value)" style="${iStyle}"></div>`;
  html += `<div><div style="font-size:11px;color:#475569;margin-bottom:4px">Distance (miles)</div><input type="number" step="0.1" id="lf_dist" value="${f.distance}" placeholder="3.1" oninput="updateLogForm('distance',this.value);updatePacePreview()" style="${iStyle}"></div>`;
  html += `<div><div style="font-size:11px;color:#475569;margin-bottom:4px">Time (mm:ss)</div><input type="text" id="lf_time" value="${f.time}" placeholder="38:00" oninput="updateLogForm('time',this.value);updatePacePreview()" style="${iStyle}"></div>`;
  html += `<div><div style="font-size:11px;color:#475569;margin-bottom:4px">Notes</div><input type="text" id="lf_notes" value="${f.notes.replace(/"/g,'&quot;')}" placeholder="Felt good, humid..." oninput="updateLogForm('notes',this.value)" style="${iStyle}"></div>`;
  html += `</div>`;
  html += `<div id="pace-preview">${pacePreview}</div>`;
  html += `<button onclick="addRun()" style="background:#4ade80;color:#0a0f1a;border:none;border-radius:6px;padding:10px 20px;font-size:13px;cursor:pointer;font-family:Georgia,serif">+ Add Run</button></div>`;

  if (STATE.runLog.length === 0) {
    html += `<div style="text-align:center;color:#334155;padding:40px;font-size:14px">No runs logged yet. Lace up! 👟</div>`;
  } else {
    const total = STATE.runLog.reduce((a, r) => a + parseFloat(r.distance || 0), 0).toFixed(1);
    [...STATE.runLog].reverse().forEach((r, i) => {
      const idx = STATE.runLog.length - 1 - i;
      const pace = calcPace(r.distance, r.time);
      html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:12px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">`;
      html += `<div>
        <div style="font-size:13px;color:#94a3b8">${r.date}</div>
        <div style="font-size:15px;color:#f8fafc;margin-top:2px">${r.distance} miles${r.time ? ' · ' + r.time : ''}${pace ? ` <span style="color:#4ade80;font-size:13px">· ${pace}</span>` : ''}</div>
        ${r.notes ? `<div style="font-size:12px;color:#475569;margin-top:2px">${r.notes}</div>` : ''}
      </div>`;
      html += `<div style="display:flex;align-items:center;gap:8px"><span style="font-size:22px">🏃</span><button onclick="deleteRun(${idx})" style="background:none;border:1px solid #334155;color:#475569;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer">✕</button></div></div>`;
    });
    html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-top:8px"><div style="font-size:12px;color:#4ade80">Total miles logged: ${total}</div></div>`;
  }
  return html;
}

function renderGuide() {
  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : {};
  let html = `<h2 style="color:#4ade80;font-weight:normal;font-size:18px;margin-bottom:20px">Training Guide</h2>`;
  
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:16px">${sectionTitle('🥗 Nutrition Rules (Tailored)','#facc15')}`;
  NUTRITION_TIPS.forEach(t => {
    html += `<div style="display:flex;gap:10px;margin-bottom:8px">${arrow()}<span style="font-size:13px;color:#94a3b8;line-height:1.5">${t}</span></div>`;
  });
  html += `</div>`;
  
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:16px">${sectionTitle('💪 Push-Up Progression','#f97316')}`;
  PUSHUP_PROG.forEach((p, i) => {
    html += `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:${i < PUSHUP_PROG.length - 1 ? '1px solid #1e293b' : 'none'}"><span style="font-size:13px;color:#64748b">Weeks ${p.week}</span><span style="font-size:13px;color:#e2e8f0">${p.reps}</span></div>`;
  });
  html += `</div>`;
  
  html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-bottom:16px">${sectionTitle('🏋️ Pull-Up Progression','#60a5fa')}`;
  PULLUP_PROG.forEach((p, i) => {
    html += `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:${i < PULLUP_PROG.length - 1 ? '1px solid #1e293b' : 'none'}"><span style="font-size:13px;color:#64748b">Weeks ${p.week}</span><span style="font-size:13px;color:#e2e8f0">${p.reps}</span></div>`;
  });
  html += `</div>`;
  
  html += `<div style="background:#0f172a;border:1px solid #60a5fa33;border-left:3px solid #60a5fa;border-radius:10px;padding:16px;margin-bottom:16px">${sectionTitle('🏅 Pace Strategy for Marathon','#60a5fa')}`;
  [
    `Target race pace: ${metrics.raceGoalPace || '9:55'}/mi (gives buffer under your limit)`,
    "Start conservatively — miles 1–6 should feel easy, almost too slow",
    "Use run/walk if needed: 9 min run, 1 min walk early on helps recovery",
    "Negative split goal: run second half slightly faster than first",
    "Miles 18–22 are the 'wall' — this is where your long run training pays off",
    "Carry 2–3 gels and take every 45 min starting at mile 6"
  ].forEach((t, i) => {
    html += `<div style="display:flex;gap:10px;margin-bottom:8px"><span style="color:#60a5fa;font-size:12px;margin-top:2px;flex-shrink:0">${i + 1}.</span><span style="font-size:13px;color:#94a3b8;line-height:1.5">${t}</span></div>`;
  });
  html += `</div>`;
  
  html += `<div style="background:#0f172a;border:1px solid #4ade8033;border-left:3px solid #4ade80;border-radius:10px;padding:16px">${sectionTitle('🏃 Running Form Tips for Speed')}`;
  [
    "Cadence: aim for 170–180 steps/min — shorter, quicker strides are more efficient",
    "Land midfoot, not on your heel — reduces impact and injury risk",
    "Keep shoulders relaxed and arms at 90°, swinging forward not across your body",
    "Slight forward lean from the ankles (not waist)",
    "Eyes forward 15–20 feet ahead, not at the ground",
    "Breathe rhythmically: try 3 steps inhale, 2 steps exhale"
  ].forEach(t => {
    html += `<div style="display:flex;gap:10px;margin-bottom:8px">${arrow()}<span style="font-size:13px;color:#94a3b8;line-height:1.5">${t}</span></div>`;
  });
  html += `</div>`;
  return html;
}

function render() {
  try {
  const p = getPhase(STATE.week);
  const pct = getWeekPct();
  const profile = window.MarathonProfile ? window.MarathonProfile.state : { name: "Runner" };
  const metrics = window.MarathonProfile ? window.MarathonProfile.getCalculatedMetrics() : { totalWeeks: 47 };
  const totalWeeks = metrics.totalWeeks;

  // Cloud sync icon — lives inside gear wrapper, just a cloud icon
  const syncIcon = window.MarathonAuth && window.MarathonAuth.currentUser
    ? `<button id="sync-btn" onclick="window.MarathonAuth.showSyncModal()" title="Cloud Sync Active"
        style="width:38px;height:38px;border-radius:50%;background:#0a1f12;border:1px solid #4ade8066;color:#4ade80;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">☁</button>`
    : `<button id="sync-btn" onclick="window.MarathonAuth.showSyncModal()" title="Connect Cloud Sync"
        style="width:38px;height:38px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#64748b;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)">☁</button>`;

  // Gear menu + sync icon — fixed top-right corner, stacked vertically
  const gearMenuHtml = `
    <div id="gear-wrapper" style="position:fixed;top:12px;right:14px;z-index:600;display:flex;flex-direction:column;align-items:center;gap:6px">
      <button id="profile-btn" onclick="toggleGearMenu(event)" title="${profile.name || 'Menu'}"
        style="width:38px;height:38px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#94a3b8;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        ⚙
      </button>
      ${syncIcon}
      <div id="gear-menu" style="display:none;position:absolute;top:calc(100% + 4px);right:0;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:6px;min-width:190px;z-index:601;box-shadow:0 8px 24px rgba(0,0,0,0.6)">
        <div style="font-size:11px;color:#475569;padding:6px 12px 4px;letter-spacing:0.06em;text-transform:uppercase">${profile.name || 'Profile'}</div>
        <div style="border-top:1px solid #1e293b;margin:4px 0"></div>
        <button onclick="closeGearMenu();window.MarathonProfile.showProfileModal()" class="gear-item">✏️ Edit Profile</button>
        <button onclick="closeGearMenu();if(window.MarathonTour)MarathonTour.showDirect()" class="gear-item">🗺️ Take a Tour</button>
        <div style="border-top:1px solid #1e293b;margin:4px 0"></div>
        <button onclick="closeGearMenu();exportData()" class="gear-item">⬇ Export Backup</button>
        <label class="gear-item" style="display:block;cursor:pointer">⬆ Import Backup<input type="file" accept=".json" onchange="closeGearMenu();importData(event)" style="display:none"></label>
        <div style="border-top:1px solid #1e293b;margin:4px 0"></div>
        <button onclick="closeGearMenu();handleSignOut()" class="gear-item" style="color:#f87171">🚪 Sign Out</button>
      </div>
    </div>
  `;

  // Tab bar — icon + short label, all visible, no scroll needed
  const tabs = [
    {id:'overview',  label:'Overview',  icon:'🗺️'},
    {id:'weekly',    label:'This Week', icon:'✅'},
    {id:'nutrition', label:'Meals',     icon:'🥗'},
    {id:'milestones',label:'Goals',     icon:'🏅'},
    {id:'log',       label:'Run Log',   icon:'🏃'},
    {id:'guide',     label:'Guide',     icon:'📖'},
  ];

  const tabBtns = tabs.map(t => `
    <button data-label="${t.label}" onclick="setTab('${t.id}')" style="
      flex:1;min-width:0;background:none;border:none;border-bottom:2px solid ${STATE.tab===t.id?'#4ade80':'transparent'};
      padding:8px 2px;cursor:pointer;color:${STATE.tab===t.id?'#4ade80':'#64748b'};
      display:flex;flex-direction:column;align-items:center;gap:2px;transition:color 0.2s;font-family:system-ui,sans-serif">
      <span style="font-size:16px;line-height:1">${t.icon}</span>
      <span style="font-size:10px;letter-spacing:0.02em;white-space:nowrap">${t.label}</span>
    </button>`).join('');

  let content = '';
  if (STATE.tab === 'overview')   content = renderOverview();
  else if (STATE.tab === 'weekly')     content = renderWeekly();
  else if (STATE.tab === 'nutrition')  content = renderNutrition();
  else if (STATE.tab === 'milestones') content = renderMilestones();
  else if (STATE.tab === 'log')        content = renderLog();
  else if (STATE.tab === 'guide')      content = renderGuide();

  const saveMsg = STATE.saveMsg
    ? `<div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#4ade80;color:#0a0f1a;padding:10px 20px;border-radius:8px;font-size:13px;z-index:999;font-family:Georgia,serif">${STATE.saveMsg}</div>`
    : '';

  document.getElementById('app').innerHTML = `
  ${gearMenuHtml}

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f2a1a 100%);border-bottom:1px solid #1e3a2f;padding:22px 20px 18px;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(74,222,128,0.06) 0%,transparent 60%);pointer-events:none"></div>
    <div style="max-width:700px;margin:0 auto;position:relative">

      <!-- Title row -->
      <div style="display:flex;align-items:flex-start;gap:12px">

        <!-- Left: title + date -->
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;letter-spacing:0.2em;color:#4ade80;text-transform:uppercase;margin-bottom:4px">Marathon Training Journal</div>
          <h1 style="margin:0;font-size:24px;font-weight:normal;color:#f8fafc;line-height:1.2;font-family:Georgia,serif">Road to 26.2</h1>
          <div style="font-size:12px;color:#64748b;margin-top:3px">
            ${new Date(profile.startDate + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
            → ${new Date(profile.raceDate + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
            · ${totalWeeks} Weeks
          </div>
        </div>

        <!-- Center/Right: phase badge (centered in its own column) -->
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:${p.color}18;border:1px solid ${p.color}44;border-radius:12px;padding:10px 16px;min-width:120px;text-align:center;margin-right:44px">
          <div style="font-size:9px;letter-spacing:0.15em;color:${p.color};text-transform:uppercase">Current Phase</div>
          <div style="font-size:17px;color:${p.color};font-weight:bold;margin-top:3px;font-family:Georgia,serif">${p.name}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">${p.weeks}</div>
        </div>

      </div>

      <!-- Week selector -->
      <div style="display:flex;align-items:center;gap:10px;margin-top:16px">
        <span style="font-size:12px;color:#64748b">Week:</span>
        <button onclick="setWeek(${Math.max(1,STATE.week-1)})" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:15px;font-family:Georgia,serif">‹</button>
        <span style="font-size:18px;color:#f8fafc;min-width:26px;text-align:center;font-family:Georgia,serif">${STATE.week}</span>
        <button onclick="setWeek(${Math.min(totalWeeks,STATE.week+1)})" style="background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:15px;font-family:Georgia,serif">›</button>
        <div style="flex:1;height:5px;background:#1e293b;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${p.color},${p.color}88);border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:11px;color:#64748b">${pct}%</span>
      </div>

    </div>
  </div>

  <!-- TAB BAR -->
  <div id="tab-bar" style="background:#0f172a;border-bottom:1px solid #1e293b;padding:0 8px">
    <div style="max-width:700px;margin:0 auto;display:flex">${tabBtns}</div>
  </div>

  <!-- CONTENT -->
  <div style="max-width:700px;margin:0 auto;padding:20px 16px">${content}</div>
  ${saveMsg}
  `;
  // render() ends here — all output is in the innerHTML block above
  } catch(err) {
    console.error('Render error:', err);
    const app = document.getElementById('app');
    if (app) app.innerHTML = `<div style="padding:40px;color:#f87171;font-family:Georgia,serif;text-align:center"><div style="font-size:32px;margin-bottom:16px">⚠️</div><div style="font-size:16px;margin-bottom:8px">Something went wrong loading the journal.</div><div style="font-size:12px;color:#475569;margin-bottom:20px">${err.message}</div><button onclick="location.reload()" style="background:#4ade80;color:#0a0f1a;border:none;border-radius:8px;padding:10px 20px;font-size:14px;cursor:pointer">Reload</button></div>`;
  }
}

// ── ACTIONS ──────────────────────────────────────────────────────
function setTab(t) {
  STATE.tab = t;
  render();
}

function toggleGearMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('gear-menu');
  if (!menu) return;
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // Close when clicking anywhere else
    setTimeout(() => {
      document.addEventListener('click', closeGearMenu, { once: true });
    }, 0);
  }
}

function closeGearMenu() {
  const menu = document.getElementById('gear-menu');
  if (menu) menu.style.display = 'none';
}

function handleSignOut() {
  if (confirm('Sign out and return to the welcome screen?')) {
    // Clear local profile so onboarding triggers again
    localStorage.removeItem('road2262_profile_v1');
    localStorage.removeItem('road2262_onboarded_v1');
    // Sign out of Firebase if logged in
    if (window.isFirebaseConfigured && firebase.auth().currentUser) {
      firebase.auth().signOut().then(() => {
        location.reload();
      }).catch(() => {
        location.reload();
      });
    } else {
      location.reload();
    }
  }
}

function setWeek(w) {
  STATE.week = w;
  persist();
  render();
}

function setMealDay(i) {
  STATE.mealDay = i;
  render();
}

function toggleTask(di, ti) {
  const k = `w${STATE.week}-d${di}-t${ti}`;
  STATE.checkedTasks[k] = !STATE.checkedTasks[k];
  persist();
  STATE.saveMsg = '✓ Saved';
  render();
  setTimeout(() => {
    STATE.saveMsg = '';
    render();
  }, 1500);
}

function saveNote() {
  const el = document.getElementById('weeknote');
  if (el) {
    STATE.notes[STATE.week] = el.value;
    persist();
  }
}

function toggleMilestone(i) {
  STATE.milestones[i].done = !STATE.milestones[i].done;
  persist();
  STATE.saveMsg = '✓ Saved';
  render();
  setTimeout(() => {
    STATE.saveMsg = '';
    render();
  }, 1500);
}

function updateLogForm(k, v) {
  STATE.logForm[k] = v;
}

function updatePacePreview() {
  const dist = document.getElementById('lf_dist') ? document.getElementById('lf_dist').value : STATE.logForm.distance;
  const time = document.getElementById('lf_time') ? document.getElementById('lf_time').value : STATE.logForm.time;
  const pace = calcPace(dist, time);
  const previewEl = document.getElementById('pace-preview');
  if (previewEl) {
    previewEl.innerHTML = pace
      ? `<div style="background:#0a1f12;border:1px solid #4ade8033;border-radius:6px;padding:8px 12px;font-size:13px;color:#4ade80;text-align:center;margin-bottom:10px">⚡ Calculated pace: <strong>${pace}</strong></div>`
      : '';
  }
}

function addRun() {
  if (!STATE.logForm.date || !STATE.logForm.distance) return;
  STATE.runLog.push({...STATE.logForm, id: Date.now()});
  STATE.logForm = {date:'', distance:'', time:'', notes:''};
  persist();
  STATE.saveMsg = '✓ Run logged!';
  render();
  setTimeout(() => {
    STATE.saveMsg = '';
    render();
  }, 2000);
}

function deleteRun(idx) {
  if (confirm('Delete this run entry?')) {
    STATE.runLog.splice(idx, 1);
    persist();
    render();
  }
}

function exportData() {
  const data = {
    checkedTasks: STATE.checkedTasks,
    milestones: STATE.milestones,
    notes: STATE.notes,
    runLog: STATE.runLog,
    week: STATE.week
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'marathon-journal-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.checkedTasks) STATE.checkedTasks = data.checkedTasks;
      if (data.milestones) STATE.milestones = data.milestones;
      if (data.notes) STATE.notes = data.notes;
      if (data.runLog) STATE.runLog = data.runLog;
      if (data.week) STATE.week = data.week;
      persist();
      STATE.saveMsg = '✓ Data imported successfully!';
      render();
      setTimeout(() => {
        STATE.saveMsg = '';
        render();
      }, 3000);
    } catch(err) {
      alert('Could not read file. Make sure it is a valid backup JSON.');
    }
  };
  reader.readAsText(file);
}

// Global update hook for cloud DB sync
function updateStateFromCloud(cloudData) {
  if (cloudData) {
    if (cloudData.checkedTasks) STATE.checkedTasks = cloudData.checkedTasks;
    if (cloudData.milestones) STATE.milestones = cloudData.milestones;
    if (cloudData.notes) STATE.notes = cloudData.notes;
    if (cloudData.runLog) STATE.runLog = cloudData.runLog;
    if (cloudData.week) STATE.week = cloudData.week;
    
    // Save to local storage as backup
    saveState({
      checkedTasks: STATE.checkedTasks,
      milestones: STATE.milestones,
      notes: STATE.notes,
      runLog: STATE.runLog,
      week: STATE.week
    });
    
    render();
  }
}

// Exposed triggers for registration/merging
function getLocalStateForSync() {
  return {
    checkedTasks: STATE.checkedTasks,
    milestones: STATE.milestones,
    notes: STATE.notes,
    runLog: STATE.runLog,
    week: STATE.week
  };
}

// ── INIT ─────────────────────────────────────────────────────────
if (window.MarathonProfile) {
  window.MarathonProfile.load();                  // load saved profile from localStorage FIRST
  window.MarathonProfile.updateCalculatedDefaults();
}
render();

// Show onboarding to first-time users (after render so app is ready behind it)
document.addEventListener('DOMContentLoaded', function() {
  if (window.MarathonOnboarding) {
    MarathonOnboarding.maybeShow();
  }
});
