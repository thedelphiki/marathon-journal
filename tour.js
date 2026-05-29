// --- GUIDED TOUR ---
// Shown after a user completes onboarding or logs in.
// Spotlights key UI elements with a brief description.
// "Don't show again" sets a localStorage flag to suppress future tours.

const TOUR_SKIP_KEY = 'road2262_tour_skip_v1';

const MarathonTour = {

  steps: [
    {
      title: "Welcome to Road to 26.2 👋",
      body: "This quick tour will show you the key features. It only takes about 30 seconds.",
      target: null, // No spotlight — centered intro card
      position: 'center'
    },
    {
      title: "Your Training Tabs 📋",
      body: "Navigate between Overview, This Week, Meal Plan, Milestones, Run Log, and Guide using the tab bar. Each tab keeps your progress saved automatically.",
      target: '.tab-bar',
      position: 'below'
    },
    {
      title: "Weekly Checklist ✅",
      body: "The 'This Week' tab is your daily driver. Check off each task as you complete it. Your progress bar fills up as the week goes on — aim for 100% every week.",
      target: null,
      position: 'center'
    },
    {
      title: "Run Log + Pace Calculator 🏃",
      body: "Log every run in the Run Log tab. Enter your distance and time and it will automatically calculate your pace. Track your improvement over 47 weeks.",
      target: null,
      position: 'center'
    },
    {
      title: "Milestones 🏅",
      body: "Tap milestones to check them off as you hit them. These are your long-range checkpoints — from your first 5K under 37 minutes all the way to race day.",
      target: null,
      position: 'center'
    },
    {
      title: "Your Profile ⚙️",
      body: "Tap the profile button in the header to update your weight, pace, race date, and more at any time. The app recalculates your training plan and nutrition targets automatically.",
      target: '#profile-btn',
      position: 'below'
    },
    {
      title: "Cloud Sync ☁️",
      body: "Tap the sync button to log in or check your account status. When signed in, every checkbox, run, and note saves instantly across all your devices.",
      target: '#sync-btn',
      position: 'below'
    },
    {
      title: "You're all set! 🎯",
      body: "Your marathon is on April 12, 2027. 47 weeks of consistent work starts now. Check your 'This Week' tab and get moving.",
      target: null,
      position: 'center'
    }
  ],

  currentStep: 0,
  _overlay: null,
  _spotlight: null,

  shouldShow: function() {
    return !localStorage.getItem(TOUR_SKIP_KEY);
  },

  show: function() {
    this.currentStep = 0;
    this._createOverlay();
    this._renderStep();
  },

  _createOverlay: function() {
    let overlay = document.getElementById('tour-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tour-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    this._overlay = overlay;
  },

  _renderStep: function() {
    const step = this.steps[this.currentStep];
    const isLast = this.currentStep === this.steps.length - 1;
    const isFirst = this.currentStep === 0;
    const progress = this.currentStep + 1;
    const total = this.steps.length;

    // Try to find and highlight the target element
    let targetEl = step.target ? document.querySelector(step.target) : null;
    let cardStyle = '';
    let spotlightHTML = '';

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const padding = 6;
      spotlightHTML = `<div class="tour-spotlight" style="
        top:${rect.top - padding + window.scrollY}px;
        left:${rect.left - padding}px;
        width:${rect.width + padding * 2}px;
        height:${rect.height + padding * 2}px;
      "></div>`;

      // Position card below or above target
      const cardTop = rect.bottom + 16 + window.scrollY;
      cardStyle = `position:absolute;top:${cardTop}px;left:50%;transform:translateX(-50%);`;
    } else {
      // Centered card
      cardStyle = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);`;
    }

    this._overlay.innerHTML = `
      <div class="tour-backdrop"></div>
      ${spotlightHTML}
      <div class="tour-card" style="${cardStyle}">
        <div class="tour-progress-bar">
          <div class="tour-progress-fill" style="width:${(progress/total)*100}%"></div>
        </div>
        <div class="tour-step-count">${progress} of ${total}</div>
        <h3 class="tour-title">${step.title}</h3>
        <p class="tour-body">${step.body}</p>
        <div class="tour-actions">
          <div class="tour-left-actions">
            ${!isFirst ? `<button class="tour-btn tour-btn-ghost" onclick="MarathonTour.prev()">← Back</button>` : ''}
          </div>
          <div class="tour-right-actions">
            <button class="tour-btn tour-btn-ghost" onclick="MarathonTour.skip()">Skip</button>
            <button class="tour-btn tour-btn-primary" onclick="MarathonTour.next()">
              ${isLast ? 'Get Started 🎯' : 'Next →'}
            </button>
          </div>
        </div>
        <div class="tour-dont-show">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" id="tour-suppress" style="accent-color:#4ade80">
            <span>Don't show this again</span>
          </label>
        </div>
      </div>
    `;
  },

  next: function() {
    this._checkSuppressFlag();
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._renderStep();
    } else {
      this.close();
    }
  },

  prev: function() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._renderStep();
    }
  },

  skip: function() {
    this._checkSuppressFlag();
    this.close();
  },

  close: function() {
    const overlay = document.getElementById('tour-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  _checkSuppressFlag: function() {
    const checkbox = document.getElementById('tour-suppress');
    if (checkbox && checkbox.checked) {
      localStorage.setItem(TOUR_SKIP_KEY, 'true');
    }
  }
};

window.MarathonTour = MarathonTour;
