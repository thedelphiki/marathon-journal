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

  maybeShow: function() {
    if (this.isIncomplete()) {
      this.showStep1();
    }
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
        <button type="submit" class="ob-btn">Continue →</button>
      </form>
      <div class="ob-step-dots">
        <span class="ob-dot ob-dot-active"></span>
        <span class="ob-dot"></span>
        <span class="ob-dot"></span>
      </div>
    `);
  },

  submitStep1: function(e) {
    e.preventDefault();
    this._draft = {
      name:         document.getElementById('ob-name').value.trim(),
      gender:       document.getElementById('ob-gender').value,
      age:          parseInt(document.getElementById('ob-age').value, 10),
      height:       parseInt(document.getElementById('ob-height').value, 10),
      weight:       parseInt(document.getElementById('ob-weight').value, 10),
      targetWeight: parseInt(document.getElementById('ob-targetWeight').value, 10),
    };
    this.showStep2();
  },

  // ── STEP 2: Training Details ───────────────────────────────────
  showStep2: function() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const raceDefault = new Date(today);
    raceDefault.setDate(today.getDate() + 47 * 7);
    const raceDateStr = raceDefault.toISOString().split('T')[0];

    this._render(`
      <div class="ob-header">
        <div class="ob-logo">📋</div>
        <h1 class="ob-title">Your Training Plan</h1>
        <p class="ob-sub">Tell us where you're starting and where you want to go.</p>
      </div>
      <form onsubmit="MarathonOnboarding.submitStep2(event)">
        <div class="ob-grid">
          <div class="ob-field">
            <label class="ob-label">Current Easy Pace (min/mi)</label>
            <input type="text" id="ob-easyPace" class="ob-input" placeholder="13:00" value="13:00" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Target Marathon Pace</label>
            <input type="text" id="ob-racePace" class="ob-input" placeholder="09:55" value="09:55" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Training Start Date</label>
            <input type="date" id="ob-start" class="ob-input" value="${todayStr}" required>
          </div>
          <div class="ob-field">
            <label class="ob-label">Target Race Date</label>
            <input type="date" id="ob-race" class="ob-input" value="${raceDateStr}" required>
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
          <div class="ob-field" style="grid-column:1/-1">
            <label class="ob-label" style="margin-bottom:8px;display:block">Rest Days <span style="color:#475569;font-size:10px;text-transform:none;letter-spacing:0">(tap days you can't train — max 3)</span></label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px" id="ob-rest-picker">
              ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>{
                const full=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i];
                const active=['Thursday','Saturday'].includes(full);
                return `<button type="button" onclick="MarathonOnboarding.toggleRestDay('${full}',this)"
                  data-day="${full}"
                  style="width:42px;height:42px;border-radius:50%;border:2px solid ${active?'#4ade80':'#334155'};
                  background:${active?'rgba(74,222,128,0.15)':'transparent'};
                  color:${active?'#4ade80':'#64748b'};font-size:11px;cursor:pointer;
                  font-family:system-ui,sans-serif;transition:all 0.15s;font-weight:${active?'bold':'normal'}"
                >${d}</button>`;
              }).join('')}
            </div>
            <input type="hidden" id="ob-restDays" value='["Thursday","Saturday"]'>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px;grid-column:1/-1">
            <button type="button" class="ob-btn ob-btn-back" onclick="MarathonOnboarding.showStep1()">← Back</button>
            <button type="submit" class="ob-btn">Continue →</button>
          </div>
      </form>
      <div class="ob-step-dots">
        <span class="ob-dot"></span>
        <span class="ob-dot ob-dot-active"></span>
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
      restDays:           JSON.parse(document.getElementById('ob-restDays').value || '["Thursday","Saturday"]'),
    };
    this.showStep3();
  },

  toggleRestDay: function(day, btn) {
    const input = document.getElementById('ob-restDays');
    let days = JSON.parse(input.value || '[]');
    if (days.includes(day)) {
      days = days.filter(d => d !== day);
      btn.style.borderColor = '#334155';
      btn.style.background = 'transparent';
      btn.style.color = '#64748b';
      btn.style.fontWeight = 'normal';
    } else {
      if (days.length >= 3) return;
      days.push(day);
      btn.style.borderColor = '#4ade80';
      btn.style.background = 'rgba(74,222,128,0.15)';
      btn.style.color = '#4ade80';
      btn.style.fontWeight = 'bold';
    }
    input.value = JSON.stringify(days);
  },

  // ── STEP 3: Account or Guest ───────────────────────────────────
  showStep3: function() {
    const firebaseReady = window.isFirebaseConfigured;
    this._render(`
      <div class="ob-header">
        <div class="ob-logo">🎯</div>
        <h1 class="ob-title">Almost ready, ${this._draft.name || 'Runner'}!</h1>
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
  },

  _hide: function() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'none';
  }
};

window.MarathonOnboarding = MarathonOnboarding;
