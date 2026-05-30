// --- MARATHON JOURNAL PROFILE & BIOMETRICS ENGINE ---

const PROFILE_STORAGE_KEY = 'road2262_profile_v1';

const MarathonProfile = {
  state: {
    name: "",
    gender: "male",
    age: 30,
    weight: 180,
    targetWeight: 165,
    height: 70,
    currentEasyPace: "12:00",
    targetMarathonPace: "10:00",
    diet: "none",
    climate: "moderate",
    restDays:    ["Thursday", "Saturday"],
    runDays:     ["Sunday", "Tuesday", "Wednesday"],
    workoutDays: ["Monday", "Friday"],
    startDate: new Date().toISOString().split('T')[0],
    raceDate: new Date(Date.now() + 47 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  isProfileOpen: false,

  load: function() {
    try {
      const p = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (p) this.state = { ...this.state, ...JSON.parse(p) };
    } catch(e) { console.error("Failed to load profile:", e); }
  },

  save: function(newState) {
    this.state = { ...this.state, ...newState };
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.state)); } catch(e) {}
    if (window.MarathonDB && typeof window.MarathonDB.syncProfileToCloud === 'function') {
      window.MarathonDB.syncProfileToCloud(this.state);
    }
    this.updateCalculatedDefaults();
    if (typeof render === 'function') render();
  },

  paceToSeconds: function(paceStr) {
    const parts = (paceStr || '12:00').split(':');
    if (parts.length !== 2) return 720;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  },

  secondsToPace: function(secs) {
    const mins = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  },

  getCalculatedMetrics: function() {
    const wKg = this.state.weight * 0.453592;
    const hCm = this.state.height * 2.54;
    let bmr = this.state.gender === 'male'
      ? 10 * wKg + 6.25 * hCm - 5 * this.state.age + 5
      : 10 * wKg + 6.25 * hCm - 5 * this.state.age - 161;
    const tdeeActive = Math.round(bmr * 1.55);
    const tdeeRest   = Math.round(bmr * 1.2);
    const caloriesActive = Math.round(tdeeActive - 300);
    const caloriesRest   = Math.round(tdeeRest   - 400);
    const proteinTarget  = Math.round(this.state.weight * 0.85);
    let waterTargetOz = Math.round(this.state.weight / 2);
    if (this.state.climate === 'south-fl') waterTargetOz += 24;
    const easySecs     = this.paceToSeconds(this.state.currentEasyPace);
    const raceSecs     = this.paceToSeconds(this.state.targetMarathonPace);
    const tempoSecs    = raceSecs - 15;
    const intervalSecs = raceSecs - 45;
    const start = new Date(this.state.startDate + 'T00:00:00');
    const end   = new Date(this.state.raceDate   + 'T00:00:00');
    const totalWeeks = Math.max(4, Math.min(52, Math.round(Math.abs(end - start) / (1000*60*60*24*7))));
    return {
      bmr: Math.round(bmr), caloriesActive, caloriesRest, proteinTarget, waterTargetOz,
      easyPace: this.state.currentEasyPace,
      tempoPace: this.secondsToPace(tempoSecs),
      intervalPace: this.secondsToPace(intervalSecs),
      raceGoalPace: this.state.targetMarathonPace,
      totalWeeks
    };
  },

  updateCalculatedDefaults: function() {
    const metrics = this.getCalculatedMetrics();
    if (typeof STATE !== 'undefined') {
      STATE.totalWeeks = metrics.totalWeeks;
      if (STATE.week > metrics.totalWeeks) STATE.week = metrics.totalWeeks;
    }
  },

  // ── DAY PICKER SHARED HELPER ──────────────────────────────────
  // Returns HTML for a row of 7 day-circle buttons for a given category
  _dayPickerHTML: function(idPrefix, labelText, hint, selectedDays, color, maxSelect) {
    const shorts = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const fulls  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const btns = shorts.map((d, i) => {
      const full   = fulls[i];
      const active = (selectedDays || []).includes(full);
      return `<button type="button"
        onclick="MarathonProfile.toggleDay('${idPrefix}','${full}',this,${maxSelect})"
        data-day="${full}" data-picker="${idPrefix}"
        style="flex:1;min-width:0;aspect-ratio:1;border-radius:50%;border:2px solid ${active ? color : '#334155'};
          background:${active ? color+'22' : '#060a12'};
          color:${active ? color : '#475569'};font-size:11px;cursor:pointer;
          font-family:system-ui,sans-serif;transition:all 0.15s;font-weight:${active ? 'bold' : 'normal'};
          padding:0;line-height:1"
      >${d}</button>`;
    }).join('');
    return `
      <div class="auth-group" style="margin-top:14px">
        <label class="auth-label" style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
          <span>${labelText}</span>
          <span style="color:#475569;font-size:10px;text-transform:none;letter-spacing:0;font-weight:normal">${hint}</span>
        </label>
        <div style="display:flex;gap:6px;width:100%" id="${idPrefix}-picker">
          ${btns}
        </div>
        <input type="hidden" id="${idPrefix}-days" value='${JSON.stringify(selectedDays || [])}'>
      </div>`;
  },

  // Universal toggle — handles cross-picker greying
  toggleDay: function(pickerPrefix, day, btn, maxSelect) {
    const input = document.getElementById(`${pickerPrefix}-days`);
    if (!input) return;
    let days = JSON.parse(input.value || '[]');
    const isActive = days.includes(day);

    if (isActive) {
      // Deselect
      days = days.filter(d => d !== day);
      input.value = JSON.stringify(days);
      this._syncPickerButtons();
    } else {
      // Check max
      if (days.length >= maxSelect) return;
      // Check not already claimed by another picker
      const allPickers = ['rest', 'run', 'workout'];
      for (const other of allPickers) {
        if (other === pickerPrefix) continue;
        const otherInput = document.getElementById(`${other}-days`);
        if (!otherInput) continue;
        const otherDays = JSON.parse(otherInput.value || '[]');
        if (otherDays.includes(day)) return; // day owned by another picker
      }
      days.push(day);
      input.value = JSON.stringify(days);
      this._syncPickerButtons();
    }
  },

  // Redraws all button states across all three pickers to reflect current selections
  _syncPickerButtons: function() {
    const colors   = { rest: '#60a5fa', run: '#4ade80', workout: '#a78bfa' };
    const prefixes = ['rest', 'run', 'workout'];
    const claimed  = {}; // day -> pickerPrefix that owns it

    prefixes.forEach(prefix => {
      const input = document.getElementById(`${prefix}-days`);
      if (!input) return;
      const days = JSON.parse(input.value || '[]');
      days.forEach(d => { claimed[d] = prefix; });
    });

    prefixes.forEach(prefix => {
      const picker = document.getElementById(`${prefix}-picker`);
      if (!picker) return;
      const input  = document.getElementById(`${prefix}-days`);
      const owned  = JSON.parse(input ? input.value : '[]');
      const color  = colors[prefix];

      picker.querySelectorAll('button[data-day]').forEach(btn => {
        const day = btn.dataset.day;
        const isOwned   = owned.includes(day);
        const isClaimed = claimed[day] && claimed[day] !== prefix;

        if (isOwned) {
          btn.style.borderColor = color;
          btn.style.background  = color + '22';
          btn.style.color       = color;
          btn.style.fontWeight  = 'bold';
          btn.style.opacity     = '1';
          btn.style.cursor      = 'pointer';
        } else if (isClaimed) {
          btn.style.borderColor = '#1e293b';
          btn.style.background  = '#060a12';
          btn.style.color       = '#1e293b';
          btn.style.fontWeight  = 'normal';
          btn.style.opacity     = '0.35';
          btn.style.cursor      = 'not-allowed';
        } else {
          btn.style.borderColor = '#334155';
          btn.style.background  = '#060a12';
          btn.style.color       = '#475569';
          btn.style.fontWeight  = 'normal';
          btn.style.opacity     = '1';
          btn.style.cursor      = 'pointer';
        }
      });
    });
  },

  // ── MODAL ─────────────────────────────────────────────────────
  showProfileModal: function() {
    this.isProfileOpen = true;
    let overlay = document.getElementById('profile-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'profile-overlay';
      overlay.className = 'auth-overlay';
      document.body.appendChild(overlay);
    }

    const s = this.state;
    const inStyle = 'width:100%;background:#060a12;border:1px solid #1e293b;border-radius:7px;color:#e2e8f0;padding:8px 10px;font-size:13px;font-family:system-ui,sans-serif;box-sizing:border-box';

    overlay.innerHTML = `
      <div class="auth-modal" style="max-width:500px;padding:24px;max-height:90vh;overflow-y:auto">
        <button class="auth-close" onclick="MarathonProfile.hideProfileModal()">✕</button>
        <h2 class="auth-title">Profile & Biometrics</h2>
        <p class="auth-subtitle">Customize your schedule, calculations, and training splits.</p>

        <form onsubmit="MarathonProfile.handleProfileSubmit(event)">

          <!-- Row 1: Name + Gender -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Name</label>
              <input type="text" id="prof-name" style="${inStyle}" value="${s.name}" required>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Gender</label>
              <select id="prof-gender" style="${inStyle};background:#060a12">
                <option value="male"   ${s.gender==='male'?'selected':''}>Male</option>
                <option value="female" ${s.gender==='female'?'selected':''}>Female</option>
              </select>
            </div>
          </div>

          <!-- Row 2: Age + Height -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Age</label>
              <input type="number" id="prof-age" style="${inStyle}" value="${s.age}" required>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Height (inches)</label>
              <input type="number" id="prof-height" style="${inStyle}" value="${s.height}" placeholder="70" required>
            </div>
          </div>

          <!-- Row 3: Weight + Target Weight -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Current Weight (lbs)</label>
              <input type="number" id="prof-weight" style="${inStyle}" value="${s.weight}" required>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Goal Weight (lbs)</label>
              <input type="number" id="prof-targetWeight" style="${inStyle}" value="${s.targetWeight}" required>
            </div>
          </div>

          <!-- Row 4: Paces -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Easy Pace (min/mi)</label>
              <input type="text" id="prof-easyPace" style="${inStyle}" value="${s.currentEasyPace}" placeholder="13:00" required>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Target Marathon Pace</label>
              <input type="text" id="prof-racePace" style="${inStyle}" value="${s.targetMarathonPace}" placeholder="09:55" required>
            </div>
          </div>

          <!-- Row 5: Diet + Climate -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Diet</label>
              <select id="prof-diet" style="${inStyle};background:#060a12">
                <option value="none"        ${s.diet==='none'?'selected':''}>Standard</option>
                <option value="vegetarian"  ${s.diet==='vegetarian'?'selected':''}>Vegetarian</option>
                <option value="vegan"       ${s.diet==='vegan'?'selected':''}>Vegan</option>
                <option value="keto"        ${s.diet==='keto'?'selected':''}>Keto</option>
                <option value="gluten-free" ${s.diet==='gluten-free'?'selected':''}>Gluten-Free</option>
              </select>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Climate</label>
              <select id="prof-climate" style="${inStyle};background:#060a12">
                <option value="south-fl"  ${s.climate==='south-fl'?'selected':''}>South FL (Hot/Humid)</option>
                <option value="moderate"  ${s.climate==='moderate'?'selected':''}>Moderate (4 Seasons)</option>
                <option value="cold"      ${s.climate==='cold'?'selected':''}>Cold/Dry</option>
              </select>
            </div>
          </div>

          <!-- Row 6: Dates — same height as all other inputs -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Training Start Date</label>
              <input type="date" id="prof-start" style="${inStyle}" value="${s.startDate}" required>
            </div>
            <div class="auth-group" style="margin:0">
              <label class="auth-label">Target Race Date</label>
              <input type="date" id="prof-race" style="${inStyle}" value="${s.raceDate}" required>
            </div>
          </div>

          <!-- Day Pickers -->
          ${this._dayPickerHTML('rest',    'Rest Days',     'max 3', s.restDays,    '#60a5fa', 3)}
          ${this._dayPickerHTML('run',     'Run Days',      'max 4', s.runDays,     '#4ade80', 4)}
          ${this._dayPickerHTML('workout', 'Workout Days',  'max 3', s.workoutDays, '#a78bfa', 3)}

          <p style="font-size:11px;color:#475569;margin:10px 0 0;line-height:1.5">
            Days not assigned to any category default to rest. Selecting a day in one row greys it out in the others.
          </p>

          <button type="submit" class="auth-btn" style="margin-top:18px">Save Profile</button>
        </form>
      </div>
    `;

    overlay.classList.add('active');
    // Sync button states on open so cross-greying is correct from the start
    setTimeout(() => this._syncPickerButtons(), 0);
  },

  hideProfileModal: function() {
    this.isProfileOpen = false;
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  handleProfileSubmit: function(event) {
    event.preventDefault();
    const restDays    = JSON.parse(document.getElementById('rest-days')?.value    || '["Thursday","Saturday"]');
    const runDays     = JSON.parse(document.getElementById('run-days')?.value     || '["Sunday","Tuesday","Wednesday"]');
    const workoutDays = JSON.parse(document.getElementById('workout-days')?.value || '["Monday","Friday"]');

    this.save({
      name:               document.getElementById('prof-name').value.trim(),
      gender:             document.getElementById('prof-gender').value,
      age:                parseInt(document.getElementById('prof-age').value, 10)          || 30,
      height:             parseInt(document.getElementById('prof-height').value, 10)       || 70,
      weight:             parseInt(document.getElementById('prof-weight').value, 10)       || 180,
      targetWeight:       parseInt(document.getElementById('prof-targetWeight').value, 10) || 165,
      currentEasyPace:    document.getElementById('prof-easyPace').value.trim(),
      targetMarathonPace: document.getElementById('prof-racePace').value.trim(),
      diet:               document.getElementById('prof-diet').value,
      climate:            document.getElementById('prof-climate').value,
      startDate:          document.getElementById('prof-start').value,
      raceDate:           document.getElementById('prof-race').value,
      restDays, runDays, workoutDays,
    });
    this.hideProfileModal();
  }
};

// Initialize
MarathonProfile.load();
MarathonProfile.updateCalculatedDefaults();
window.MarathonProfile = MarathonProfile;
