// --- ONBOARDING FLOW ---
// Shown to any user whose profile is incomplete (no name set),
// regardless of login state. Returning users with a saved name are never interrupted.

const ONBOARDING_KEY = 'road2262_onboarded_v1';

const MarathonOnboarding = {

  // Show if profile has no name — covers new guests AND new account holders
  isIncomplete: function() {
    const profile = window.MarathonProfile ? window.MarathonProfile.state : null;
    return !profile || !profile.name || profile.name.trim() === '';
  },

  markComplete: function() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  },

  // ── STEP 0: Goal Selection ────────────────────────────────────
  // This is the new entry point — routes to correct plan and fitnessLevel
  maybeShow: function() {
    // Never fire while the landing page is gating access
    if (window.MarathonLanding && window.MarathonLanding.isVisible) return;
    if (this.isIncomplete()) {
      this.showStep0();
    }
  },

  showStep0: function() {
    // Hard guard — never show onboarding while landing page is visible
    if (window.MarathonLanding && window.MarathonLanding.isVisible) return;
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">🎯</div>
        <h1 class="ob-title">What's your goal?</h1>
        <p class="ob-sub">Your plan is built around this. You can change it anytime.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
        ${Object.values(TRAINING_GOALS).map(g => `
          <button type="button" onclick="MarathonOnboarding.selectGoal('${g.id}')"
            id="ob-goal-${g.id}"
            style="background:#060a12;border:2px solid #1e293b;border-radius:10px;
              padding:12px 16px;text-align:left;cursor:pointer;transition:all 0.15s;
              display:flex;align-items:center;gap:12px;width:100%">
            <span style="font-size:22px;flex-shrink:0">${g.emoji}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;color:#e2e8f0;font-family:system-ui">${g.label}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px;font-family:system-ui">${g.tagline}</div>
            </div>
          </button>`).join('')}
      </div>
      <div class="ob-step-dots">
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
      </div>
    `);
  },

  selectGoal: function(goalId) {
    // Highlight selected card
    Object.keys(TRAINING_GOALS).forEach(id => {
      const btn = document.getElementById('ob-goal-' + id);
      if (!btn) return;
      const g = TRAINING_GOALS[id];
      if (id === goalId) {
        btn.style.borderColor = g.color;
        btn.style.background  = g.color + '18';
        btn.querySelector('div > div:first-child').style.color = g.color;
      } else {
        btn.style.borderColor = '#1e293b';
        btn.style.background  = '#060a12';
        btn.querySelector('div > div:first-child').style.color = '#e2e8f0';
      }
    });
    this._draft.trainingGoal = goalId;
    // Set sensible defaults based on goal
    const g = TRAINING_GOALS[goalId];
    if (g) {
      this._draft.currentEasyPace    = g.defaultPace;
      this._draft.targetMarathonPace = g.defaultPace;
      // For c25k/fitness set beginner level, otherwise intermediate
      this._draft.fitnessLevel = (goalId === 'c25k' || goalId === 'fitness') ? 'beginner' : 'intermediate';
      // Auto-set race date based on goal's default weeks
      const raceDate = new Date();
      raceDate.setDate(raceDate.getDate() + g.defaultWeeks * 7);
      this._draft.raceDate = raceDate.toISOString().split('T')[0];
    }
    // Advance to fitness level after brief delay for feedback
    setTimeout(() => this.showStep0b(), 250);
  },

  // ── STEP 0b: Fitness Level ─────────────────────────────────────
  showStep0b: function() {
    const goal = TRAINING_GOALS[this._draft.trainingGoal] || TRAINING_GOALS.marathon;
    const levels = [
      { id:'beginner',     label:'New to exercise',  desc:'Little or no current fitness routine',         emoji:'🌱' },
      { id:'intermediate', label:'Somewhat active',   desc:'Exercise occasionally, can run a mile or two', emoji:'🏃' },
      { id:'advanced',     label:'Regularly active',  desc:'Consistent training, solid aerobic base',      emoji:'⚡' },
    ];
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">${goal.emoji}</div>
        <h1 class="ob-title">${goal.label}</h1>
        <p class="ob-sub">How would you describe your current fitness?</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
        ${levels.map(l => {
          const active = this._draft.fitnessLevel === l.id;
          return `<button type="button" onclick="MarathonOnboarding.selectFitnessLevel('${l.id}',this)"
            data-level="${l.id}"
            style="background:${active ? goal.color+'18' : '#060a12'};
              border:2px solid ${active ? goal.color : '#1e293b'};
              border-radius:10px;padding:12px 16px;text-align:left;cursor:pointer;
              transition:all 0.15s;display:flex;align-items:center;gap:12px;width:100%">
            <span style="font-size:22px;flex-shrink:0">${l.emoji}</span>
            <div>
              <div style="font-size:14px;color:${active ? goal.color : '#e2e8f0'};font-family:system-ui">${l.label}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px;font-family:system-ui">${l.desc}</div>
            </div>
          </button>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:10px">
        <button type="button" class="ob-btn ob-btn-back" onclick="MarathonOnboarding.showStep0()">← Back</button>
        <button type="button" class="ob-btn" onclick="MarathonOnboarding.submitStep0b()">Continue →</button>
      </div>
      <div class="ob-step-dots" style="margin-top:16px">
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
      </div>
    `);
  },

  selectFitnessLevel: function(level, btn) {
    this._draft.fitnessLevel = level;
    const goal = TRAINING_GOALS[this._draft.trainingGoal] || TRAINING_GOALS.marathon;
    document.querySelectorAll('[data-level]').forEach(b => {
      const isActive = b.dataset.level === level;
      b.style.borderColor = isActive ? goal.color : '#1e293b';
      b.style.background  = isActive ? goal.color + '18' : '#060a12';
      b.querySelector('div > div:first-child').style.color = isActive ? goal.color : '#e2e8f0';
    });
  },

  submitStep0b: function() {
    if (!this._draft.fitnessLevel) this._draft.fitnessLevel = 'intermediate';
    this.showStep1();
  },



  // ── STEP 1: Personal Info ──────────────────────────────────────
  showStep1: function() {
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">🏃</div>
        <h1 class="ob-title">Road to 26.2</h1>
        <p class="ob-sub">Your personal marathon training journal.<br>Let's set up your plan in under a minute.</p>
      </div>
      <form onsubmit="MarathonOnboarding.submitStep1(event)">
        <div class="ob-grid">
          <div class="ob-field">
            <label class="ob-label">Your Name</label>
            <input type="text" id="ob-name" class="ob-input" placeholder="e.g. Alex" required autofocus>
          </div>
          <div class="ob-field">
            <label class="ob-label">Gender</label>
            <select id="ob-gender" class="ob-input" style="background:#060a12">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div class="ob-field">
            <label class="ob-label">Age</label>
            <input type="number" id="ob-age" class="ob-input" placeholder="e.g. 41" min="16" max="99" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Height (inches)</label>
            <input type="number" id="ob-height" class="ob-input" placeholder="e.g. 72 for 6ft" min="48" max="96" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Current Weight (lbs)</label>
            <input type="number" id="ob-weight" class="ob-input" placeholder="e.g. 220" min="80" max="400" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Goal Weight (lbs)</label>
            <input type="number" id="ob-targetWeight" class="ob-input" placeholder="e.g. 185" min="80" max="400" required>
          </div>
        </div>
        <div style="display:flex;gap:10px">
          <button type="button" class="ob-btn ob-btn-back" onclick="MarathonOnboarding.showStep0b()">← Back</button>
          <button type="submit" class="ob-btn">Continue →</button>
        </div>
      </form>
      <div class="ob-step-dots">
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
      </div>
    `);
  },

  submitStep1: function(e) {
    e.preventDefault();
    this._draft = {
      ...this._draft,
      name:         document.getElementById('ob-name').value.trim(),
      gender:       document.getElementById('ob-gender').value,
      age:          parseInt(document.getElementById('ob-age').value, 10),
      height:       parseInt(document.getElementById('ob-height').value, 10),
      weight:       parseInt(document.getElementById('ob-weight').value, 10),
      targetWeight: parseInt(document.getElementById('ob-targetWeight').value, 10),
    };
    this.showStep2();
  },

  // ── STEP 2: Pace, Dates, Climate, Diet ──────────────────────
  showStep2: function() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const raceDefault = new Date(today);
    raceDefault.setDate(today.getDate() + 47 * 7);
    const raceDateStr = raceDefault.toISOString().split('T')[0];
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">📋</div>
        <h1 class="ob-title">Training Details</h1>
        <p class="ob-sub">Tell us your current pace and race goal.</p>
      </div>
      <form onsubmit="MarathonOnboarding.submitStep2(event)">
        <div class="ob-grid">
          <div class="ob-field">
            <label class="ob-label">Current Easy Pace (min/mi)</label>
            <input type="text" id="ob-easyPace" class="ob-input" placeholder="13:00" value="${this._draft.currentEasyPace||'13:00'}" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Target Marathon Pace</label>
            <input type="text" id="ob-racePace" class="ob-input" placeholder="09:55" value="${this._draft.targetMarathonPace||'09:55'}" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Training Climate</label>
            <select id="ob-climate" class="ob-input" style="background:#060a12">
              <option value="south-fl">South FL — Hot &amp; Humid</option>
              <option value="moderate">Moderate — Four Seasons</option>
              <option value="cold">Cold / Dry Climate</option>
            </select>
          </div>
          <div class="ob-field">
            <label class="ob-label">Dietary Preference</label>
            <select id="ob-diet" class="ob-input" style="background:#060a12">
              <option value="none">Standard (No restrictions)</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Ketogenic</option>
              <option value="gluten-free">Gluten-Free</option>
            </select>
          </div>
          <!-- Dates: each full width to prevent mobile overlap -->
          <div class="ob-field" style="grid-column:1/-1">
            <label class="ob-label">Training Start Date</label>
            <input type="date" id="ob-start" class="ob-input" value="${todayStr}" required>
          </div>
          <div class="ob-field" style="grid-column:1/-1">
            <label class="ob-label">Target Race Date</label>
            <input type="date" id="ob-race" class="ob-input" value="${raceDateStr}" required>
          </div>
          <div style="display:flex;gap:10px;grid-column:1/-1;margin-top:6px">
            <button type="button" class="ob-btn ob-btn-back" onclick="MarathonOnboarding.showStep1()">← Back</button>
            <button type="submit" class="ob-btn">Continue →</button>
          </div>
        </div>
      </form>
      <div class="ob-step-dots">
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
      </div>
    `);
  },

  submitStep2: function(e) {
    e.preventDefault();
    this._draft = {
      ...this._draft,
      currentEasyPace:    document.getElementById('ob-easyPace').value.trim(),
      targetMarathonPace: document.getElementById('ob-racePace').value.trim(),
      startDate:          document.getElementById('ob-start').value,
      raceDate:           document.getElementById('ob-race').value,
      climate:            document.getElementById('ob-climate').value,
      diet:               document.getElementById('ob-diet').value,
    };
    this.showStep2b();
  },

  // ── STEP 2b: Workout Style + Schedule ─────────────────────────
  showStep2b: function() {
    const defRest    = this._draft.restDays    || ['Thursday','Saturday'];
    const defCardio  = this._draft.cardDays    || ['Sunday','Tuesday','Wednesday'];
    const defWorkout = this._draft.workoutDays || ['Monday','Friday'];
    const defStr     = this._draft.strengthType || 'calisthenics';
    const defCard    = this._draft.cardioType   || 'running';

    const shorts = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const fulls  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    const dayRow = (idPrefix, selectedDays, color) => shorts.map((d,i) => {
      const full   = fulls[i];
      const active = selectedDays.includes(full);
      return `<button type="button"
        onclick="MarathonOnboarding.toggleDay('${idPrefix}','${full}',this)"
        data-day="${full}" data-picker="${idPrefix}"
        style="flex:1;min-width:0;aspect-ratio:1;border-radius:50%;
          border:2px solid ${active ? color : '#334155'};
          background:${active ? color+'22' : 'transparent'};
          color:${active ? color : '#475569'};font-size:11px;cursor:pointer;
          font-family:system-ui,sans-serif;transition:all 0.15s;
          font-weight:${active ? 'bold' : 'normal'};padding:0;line-height:1"
      >${d}</button>`;
    }).join('');

    const typeCard = (groupId, value, label, icon, currentVal, color) => {
      const active = currentVal === value;
      return `<div onclick="MarathonOnboarding.selectType('${groupId}','${value}')"
        id="ob-tc-${groupId}-${value}"
        style="flex:1;min-width:0;background:${active ? color+'18' : 'transparent'};
          border:2px solid ${active ? color : '#334155'};
          border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all 0.15s">
        <div style="font-size:20px;margin-bottom:5px">${icon}</div>
        <div style="font-size:11px;color:${active ? color : '#94a3b8'};font-weight:${active ? 'bold' : 'normal'};line-height:1.3">${label}</div>
        <input type="radio" name="${groupId}" value="${value}" ${active ? 'checked' : ''} style="display:none" id="ob-radio-${groupId}-${value}">
      </div>`;
    };

    this._render(`
      <div class="ob-header">
        <div class="ob-logo">💪</div>
        <h1 class="ob-title">Workout Style & Schedule</h1>
        <p class="ob-sub">How do you like to train? Pick your style and assign your days.</p>
      </div>
      <form onsubmit="MarathonOnboarding.submitStep2b(event)" style="max-height:70vh;overflow-y:auto;padding-right:4px">

        <div style="font-size:11px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Strength Training</div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          ${typeCard('strengthType','calisthenics','Calisthenics','💪',defStr,'#f97316')}
          ${typeCard('strengthType','weights','Weightlifting','🏋️',defStr,'#f97316')}
          ${typeCard('strengthType','both','Both','⚡',defStr,'#f97316')}
        </div>

        <div style="font-size:11px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Cardio Style</div>
        <div style="display:flex;gap:8px;margin-bottom:14px">
          ${typeCard('cardioType','running','Running Only','🏃',defCard,'#4ade80')}
          ${typeCard('cardioType','running+cycling','Run + Cycle','🚴',defCard,'#4ade80')}
        </div>

        <div style="font-size:11px;color:#4ade80;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px">Weekly Schedule</div>

        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Rest Days</span>
            <span style="font-size:10px;color:#475569">max 3</span>
          </div>
          <div style="display:flex;gap:5px;width:100%" id="ob-rest-picker">${dayRow('rest', defRest, '#60a5fa')}</div>
          <input type="hidden" id="ob-rest-days" value='${JSON.stringify(defRest)}'>
        </div>

        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Cardio Days</span>
            <span style="font-size:10px;color:#475569">max 4</span>
          </div>
          <div style="display:flex;gap:5px;width:100%" id="ob-cardio-picker">${dayRow('cardio', defCardio, '#4ade80')}</div>
          <input type="hidden" id="ob-cardio-days" value='${JSON.stringify(defCardio)}'>
        </div>

        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em">Workout Days</span>
            <span style="font-size:10px;color:#475569">max 3</span>
          </div>
          <div style="display:flex;gap:5px;width:100%" id="ob-workout-picker">${dayRow('workout', defWorkout, '#a78bfa')}</div>
          <input type="hidden" id="ob-workout-days" value='${JSON.stringify(defWorkout)}'>
        </div>

        <p style="font-size:11px;color:#475569;margin-bottom:12px;line-height:1.5">
          Selecting a day in one row greys it out in the others. Unassigned days become rest.
        </p>

        <div style="display:flex;gap:10px">
          <button type="button" class="ob-btn ob-btn-back" onclick="MarathonOnboarding.showStep2()">← Back</button>
          <button type="submit" class="ob-btn">Continue →</button>
        </div>
      </form>
      <div class="ob-step-dots">
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
      </div>
    `);
    setTimeout(() => MarathonOnboarding._syncPickerButtons(), 0);
  },

  submitStep2b: function(e) {
    e.preventDefault();
    const getJSON = (id, def) => { try { return JSON.parse(document.getElementById(id)?.value || def); } catch(err) { return JSON.parse(def); } };
    const getRadio = (name, def) => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : def; };
    this._draft = {
      ...this._draft,
      strengthType: getRadio('strengthType', 'calisthenics'),
      cardioType:   getRadio('cardioType',   'running'),
      restDays:     getJSON('ob-rest-days',    '["Thursday","Saturday"]'),
      cardDays:     getJSON('ob-cardio-days',  '["Sunday","Tuesday","Wednesday"]'),
      workoutDays:  getJSON('ob-workout-days', '["Monday","Friday"]'),
    };
    this.showStep3();
  },

  selectType: function(groupId, value) {
    const radio = document.getElementById(`ob-radio-${groupId}-${value}`);
    if (radio) radio.checked = true;
    const colors   = { strengthType: '#f97316', cardioType: '#4ade80' };
    const color    = colors[groupId] || '#4ade80';
    const variants = groupId === 'strengthType' ? ['calisthenics','weights','both'] : ['running','running+cycling'];
    variants.forEach(v => {
      const card = document.getElementById(`ob-tc-${groupId}-${v}`);
      if (!card) return;
      const active = v === value;
      card.style.background  = active ? color+'18' : 'transparent';
      card.style.borderColor = active ? color : '#334155';
      const lbl = card.querySelectorAll('div')[1];
      if (lbl) { lbl.style.color = active ? color : '#94a3b8'; lbl.style.fontWeight = active ? 'bold' : 'normal'; }
    });
  },

  toggleDay: function(pickerPrefix, day, btn) {
    const input = document.getElementById(`ob-${pickerPrefix}-days`);
    if (!input) return;
    let days = JSON.parse(input.value || '[]');
    const maxes = { rest:3, cardio:4, workout:3 };
    if (days.includes(day)) {
      days = days.filter(d => d !== day);
      input.value = JSON.stringify(days);
    } else {
      if (days.length >= (maxes[pickerPrefix]||3)) return;
      for (const other of ['rest','cardio','workout']) {
        if (other === pickerPrefix) continue;
        const o = document.getElementById(`ob-${other}-days`);
        if (o && JSON.parse(o.value||'[]').includes(day)) return;
      }
      days.push(day);
      input.value = JSON.stringify(days);
    }
    this._syncPickerButtons();
  },

  _syncPickerButtons: function() {
    const colors = { rest:'#60a5fa', cardio:'#4ade80', workout:'#a78bfa' };
    const claimed = {};
    ['rest','cardio','workout'].forEach(p => {
      const inp = document.getElementById(`ob-${p}-days`);
      if (!inp) return;
      JSON.parse(inp.value||'[]').forEach(d => { claimed[d] = p; });
    });
    ['rest','cardio','workout'].forEach(p => {
      const picker = document.getElementById(`ob-${p}-picker`);
      if (!picker) return;
      const owned = JSON.parse(document.getElementById(`ob-${p}-days`)?.value||'[]');
      const color = colors[p];
      picker.querySelectorAll('button[data-day]').forEach(btn => {
        const day = btn.dataset.day;
        const isOwned   = owned.includes(day);
        const isClaimed = claimed[day] && claimed[day] !== p;
        if (isOwned) {
          btn.style.borderColor = color; btn.style.background = color+'22';
          btn.style.color = color; btn.style.fontWeight = 'bold';
          btn.style.opacity = '1'; btn.style.cursor = 'pointer';
        } else if (isClaimed) {
          btn.style.borderColor = '#1e293b'; btn.style.background = '#060a12';
          btn.style.color = '#1e293b'; btn.style.fontWeight = 'normal';
          btn.style.opacity = '0.35'; btn.style.cursor = 'not-allowed';
        } else {
          btn.style.borderColor = '#334155'; btn.style.background = 'transparent';
          btn.style.color = '#475569'; btn.style.fontWeight = 'normal';
          btn.style.opacity = '1'; btn.style.cursor = 'pointer';
        }
      });
    });
  },

  // (legacy stubs)
  toggleRestDay: function() {},

      // ── STEP 3: Account or Guest ───────────────────────────────────
  showStep3: function() {
    const firebaseReady = window.isFirebaseConfigured;
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">🎯</div>
        <h1 class="ob-title">Almost ready, ${(this._draft.name||'Runner').slice(0,60).replace(/[<>&]/g,'').replace(/"/g,'&quot;')}!</h1>
        <p class="ob-sub">How would you like to save your progress?</p>
      </div>
      <div class="ob-choice-cards">
        <div class="ob-card" onclick="MarathonOnboarding.chooseAccount()" style="border-color:${firebaseReady ? '#4ade8066' : '#334155'};${!firebaseReady ? 'opacity:0.5;pointer-events:none' : ''}">
          <div class="ob-card-icon">☁️</div>
          <div class="ob-card-title">Create Account</div>
          <div class="ob-card-desc">Sync across all your devices. Your data is safe even if you clear your browser.</div>
          ${!firebaseReady ? '<div style="font-size:11px;color:#f87171;margin-top:6px">Firebase not configured</div>' : ''}
        </div>
        <div class="ob-card" onclick="MarathonOnboarding.chooseGuest()" style="border-color:#facc1566">
          <div class="ob-card-icon">📱</div>
          <div class="ob-card-title">Continue as Guest</div>
          <div class="ob-card-desc">Data saves on this device only. You can create an account later from the app.</div>
        </div>
      </div>
      <button type="button" class="ob-btn ob-btn-back" style="margin-top:16px;max-width:120px" onclick="MarathonOnboarding.showStep2()">← Back</button>
      <div class="ob-step-dots">
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
      </div>
    `);
  },

  chooseAccount: function() {
    this._saveProfile();
    this.markComplete();
    this._hide();
    if (window.MarathonAuth) {
      MarathonAuth.isSignUpMode = true;
      MarathonAuth.showSyncModal();
    }
    if (typeof render === 'function') render();
    // Tour fires after auth modal is dismissed — handled in auth.js observer
  },

  chooseGuest: function() {
    this._saveProfile();
    this.markComplete();
    this._hide();
    if (typeof render === 'function') render();
    // Show tour after brief delay so app renders first
    setTimeout(function() {
      if (window.MarathonTour && MarathonTour.shouldShow()) {
        MarathonTour.show();
      }
    }, 400);
  },

  // ── Helpers ───────────────────────────────────────────────────
  _draft: {},

  _saveProfile: function() {
    if (window.MarathonProfile) {
      MarathonProfile.save(this._draft);
    }
  },

  _render: function(html) {
    let overlay = document.getElementById('onboarding-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboarding-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="ob-modal">${html}</div>`;
    overlay.style.display = 'flex';
    document.body.classList.add('onboarding-open');
  },

  _hide: function() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('onboarding-open');
  }
};

window.MarathonOnboarding = MarathonOnboarding;
