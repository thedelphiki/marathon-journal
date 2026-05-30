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
    restDays: ["Thursday", "Saturday"],
    restDays: ["Thursday", "Saturday"],
    startDate: new Date().toISOString().split('T')[0],
    raceDate: new Date(Date.now() + 47 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  isProfileOpen: false,

  // Load from local storage
  load: function() {
    try {
      const p = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (p) {
        this.state = { ...this.state, ...JSON.parse(p) };
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
    }
  },

  // Save to local storage & trigger sync/re-render
  save: function(newState) {
    this.state = { ...this.state, ...newState };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}

    // Firestore Sync
    if (window.MarathonDB && typeof window.MarathonDB.syncProfileToCloud === 'function') {
      window.MarathonDB.syncProfileToCloud(this.state);
    }

    // Dynamic calculations update & full render
    this.updateCalculatedDefaults();
    if (typeof render === 'function') {
      render();
    }
  },

  // Helper: Convert pace string "mm:ss" to total seconds
  paceToSeconds: function(paceStr) {
    const parts = paceStr.split(":");
    if (parts.length !== 2) return 600; // default 10:00 split
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  },

  // Helper: Convert total seconds to "mm:ss" string
  secondsToPace: function(secs) {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.round(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  },

  // Dynamic calculated nutrition & training metrics
  getCalculatedMetrics: function() {
    const wKg = this.state.weight * 0.453592;
    const hCm = this.state.height * 2.54;
    
    // 1. Basal Metabolic Rate (BMR) - Mifflin-St Jeor
    let bmr = 0;
    if (this.state.gender === "male") {
      bmr = 10 * wKg + 6.25 * hCm - 5 * this.state.age + 5;
    } else {
      bmr = 10 * wKg + 6.25 * hCm - 5 * this.state.age - 161;
    }

    // 2. TDEE (Total Daily Energy Expenditure) based on training activity
    const tdeeActive = Math.round(bmr * 1.55); // active days
    const tdeeRest = Math.round(bmr * 1.2);    // sedentary rest days

    // Calorie targets for weight management while fueling recovery
    const caloriesActive = Math.round(tdeeActive - 300); // 300 kcal safe deficit
    const caloriesRest = Math.round(tdeeRest - 400);     // 400 kcal safe rest-day deficit

    // 3. Protein goal (0.85g per lb of target body weight)
    const proteinTarget = Math.round(this.state.weight * 0.85);

    // 4. Hydration target in ounces (weight in lbs / 2) + climate heat adder
    let waterTargetOz = Math.round(this.state.weight / 2);
    if (this.state.climate === "south-fl") {
      waterTargetOz += 24; // South FL Heat Safety adder
    }

    // 5. Training Paces
    const easySecs = this.paceToSeconds(this.state.currentEasyPace);
    const raceSecs = this.paceToSeconds(this.state.targetMarathonPace);

    const tempoSecs = raceSecs - 15;    // Tempo is roughly 15s faster than race pace
    const intervalSecs = raceSecs - 45; // Interval repeats are roughly 45s faster than race pace

    // Calculate dates & duration in weeks
    const start = new Date(this.state.startDate + 'T00:00:00');
    const end = new Date(this.state.raceDate + 'T00:00:00');
    const diffTime = Math.abs(end - start);
    const totalWeeks = Math.max(4, Math.min(52, Math.round(diffTime / (1000 * 60 * 60 * 24 * 7))));

    return {
      bmr: Math.round(bmr),
      caloriesActive,
      caloriesRest,
      proteinTarget,
      waterTargetOz,
      easyPace: this.state.currentEasyPace,
      tempoPace: this.secondsToPace(tempoSecs),
      intervalPace: this.secondsToPace(intervalSecs),
      raceGoalPace: this.state.targetMarathonPace,
      totalWeeks
    };
  },

  // Updates global constants & variables in app.js dynamically
  updateCalculatedDefaults: function() {
    const metrics = this.getCalculatedMetrics();
    
    // Inject custom variables into app.js state
    if (typeof STATE !== 'undefined') {
      STATE.totalWeeks = metrics.totalWeeks;
      // Adjust current week bounds if profile updates total training weeks
      if (STATE.week > metrics.totalWeeks) {
        STATE.week = metrics.totalWeeks;
      }
    }
  },

  // Modal UI Renderer
  showProfileModal: function() {
    this.isProfileOpen = true;
    let overlay = document.getElementById('profile-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'profile-overlay';
      overlay.className = 'auth-overlay';
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="auth-modal" style="max-width: 500px; padding: 24px; max-height: 90vh; overflow-y: auto;">
        <button class="auth-close" onclick="MarathonProfile.hideProfileModal()">✕</button>
        <h2 class="auth-title">Profile & Biometrics</h2>
        <p class="auth-subtitle">Customize calculations, schedules, diet templates, and splits.</p>
        
        <form onsubmit="MarathonProfile.handleProfileSubmit(event)">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="auth-group">
              <label class="auth-label">Runner's Name</label>
              <input type="text" id="prof-name" class="auth-input" value="${this.state.name}" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Gender</label>
              <select id="prof-gender" class="auth-input" style="background:#060a12;">
                <option value="male" ${this.state.gender==='male'?'selected':''}>Male</option>
                <option value="female" ${this.state.gender==='female'?'selected':''}>Female</option>
              </select>
            </div>
            <div class="auth-group">
              <label class="auth-label">Age</label>
              <input type="number" id="prof-age" class="auth-input" value="${this.state.age}" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Height (inches)</label>
              <input type="number" id="prof-height" class="auth-input" value="${this.state.height}" placeholder="e.g. 70" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Current Weight (lbs)</label>
              <input type="number" id="prof-weight" class="auth-input" value="${this.state.weight}" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Target Weight (lbs)</label>
              <input type="number" id="prof-targetWeight" class="auth-input" value="${this.state.targetWeight}" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Easy Run Pace (min/mi)</label>
              <input type="text" id="prof-easyPace" class="auth-input" value="${this.state.currentEasyPace}" placeholder="13:00" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Target Marathon Pace</label>
              <input type="text" id="prof-racePace" class="auth-input" value="${this.state.targetMarathonPace}" placeholder="09:55" required>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
            <div class="auth-group">
              <label class="auth-label">Dietary Plan</label>
              <select id="prof-diet" class="auth-input" style="background:#060a12;">
                <option value="none" ${this.state.diet==='none'?'selected':''}>Standard (No restrictions)</option>
                <option value="vegetarian" ${this.state.diet==='vegetarian'?'selected':''}>Vegetarian</option>
                <option value="vegan" ${this.state.diet==='vegan'?'selected':''}>Vegan</option>
                <option value="keto" ${this.state.diet==='keto'?'selected':''}>Ketogenic</option>
                <option value="gluten-free" ${this.state.diet==='gluten-free'?'selected':''}>Gluten-Free</option>
              </select>
            </div>
            <div class="auth-group">
              <label class="auth-label">Training Climate</label>
              <select id="prof-climate" class="auth-input" style="background:#060a12;">
                <option value="south-fl" ${this.state.climate==='south-fl'?'selected':''}>South FL (High Heat/Humid)</option>
                <option value="moderate" ${this.state.climate==='moderate'?'selected':''}>Moderate (Four Seasons)</option>
                <option value="cold" ${this.state.climate==='cold'?'selected':''}>Cold/Dry Climate</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
            <div class="auth-group">
              <label class="auth-label">Training Start Date</label>
              <input type="date" id="prof-start" class="auth-input" value="${this.state.startDate}" required>
            </div>
            <div class="auth-group">
              <label class="auth-label">Target Race Date</label>
              <input type="date" id="prof-race" class="auth-input" value="${this.state.raceDate}" required>
            </div>
          </div>

          <div class="auth-group" style="margin-top:12px">
            <label class="auth-label" style="margin-bottom:10px;display:block">Rest Days <span style="color:#475569;font-size:11px;text-transform:none;letter-spacing:0">(select 1–3 days — workouts fill the rest)</span></label>
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="rest-day-picker">
              ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                const full = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i];
                const active = (this.state.restDays || []).includes(full);
                return `<button type="button" onclick="MarathonProfile.toggleRestDay('${full}',this)"
                  data-day="${full}"
                  style="width:42px;height:42px;border-radius:50%;border:2px solid ${active?'#4ade80':'#334155'};
                  background:${active?'rgba(74,222,128,0.15)':'#060a12'};
                  color:${active?'#4ade80':'#64748b'};font-size:11px;cursor:pointer;
                  font-family:system-ui,sans-serif;transition:all 0.15s;font-weight:${active?'bold':'normal'}"
                >${d}</button>`;
              }).join('')}
            </div>
            <input type="hidden" id="prof-restDays" value="${JSON.stringify(this.state.restDays || ['Thursday','Saturday'])}">
          </div>
          
          <button type="submit" class="auth-btn" style="margin-top: 20px;">Save Profile</button>
        </form>
      </div>
    `;
    
    overlay.classList.add('active');
  },

  toggleRestDay: function(day, btn) {
    const input = document.getElementById('prof-restDays');
    let days = JSON.parse(input.value || '[]');
    if (days.includes(day)) {
      days = days.filter(d => d !== day);
      btn.style.borderColor = '#334155';
      btn.style.background = '#060a12';
      btn.style.color = '#64748b';
      btn.style.fontWeight = 'normal';
    } else {
      if (days.length >= 3) return; // max 3 rest days
      days.push(day);
      btn.style.borderColor = '#4ade80';
      btn.style.background = 'rgba(74,222,128,0.15)';
      btn.style.color = '#4ade80';
      btn.style.fontWeight = 'bold';
    }
    input.value = JSON.stringify(days);
  },

  hideProfileModal: function() {
    this.isProfileOpen = false;
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  handleProfileSubmit: function(event) {
    event.preventDefault();
    
    const parsedState = {
      name: document.getElementById('prof-name').value.trim(),
      gender: document.getElementById('prof-gender').value,
      age: parseInt(document.getElementById('prof-age').value, 10) || 28,
      height: parseInt(document.getElementById('prof-height').value, 10) || 70,
      weight: parseInt(document.getElementById('prof-weight').value, 10) || 220,
      targetWeight: parseInt(document.getElementById('prof-targetWeight').value, 10) || 185,
      currentEasyPace: document.getElementById('prof-easyPace').value.trim(),
      targetMarathonPace: document.getElementById('prof-racePace').value.trim(),
      diet: document.getElementById('prof-diet').value,
      climate: document.getElementById('prof-climate').value,
      restDays: JSON.parse(document.getElementById('prof-restDays').value || '["Thursday","Saturday"]'),
      startDate: document.getElementById('prof-start').value,
      raceDate: document.getElementById('prof-race').value
    };

    this.save(parsedState);
    this.hideProfileModal();
  }
};

// Initialize
MarathonProfile.load();
MarathonProfile.updateCalculatedDefaults();

// Bind globally
window.MarathonProfile = MarathonProfile;
