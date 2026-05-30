// --- GUIDED TOUR ---
// First shows a "Would you like a tour?" prompt.
// Prompts on every fresh page load until "Don't show this again" is checked.
// Spotlight uses clip-path cutout so the target area stays fully visible.
// Automatically switches tabs when touring tab-specific steps.

const TOUR_SKIP_KEY = 'road2262_tour_skip_v1';

const MarathonTour = {

  // Step 0 is the prompt card. Steps 1+ are the actual tour.
  steps: [
    {
      title: "Welcome to Road to 26.2 🏃",
      body: "Would you like a quick tour of the app? It takes about 30 seconds and covers all the key features.",
      target: null,
      tab: null,
      isPrompt: true   // Special flag — renders Yes/No instead of Next/Skip
    },
    {
      title: "Tab Navigation 📋",
      body: "Use these tabs to move between sections of your journal. Each one keeps your data saved automatically.",
      target: '.tab-bar',
      tab: null,        // Don't switch tab — show the bar itself
      position: 'below'
    },
    {
      title: "Overview 🗺️",
      body: "The Overview tab shows your training phases, current week progress, and a visual map of all 47 weeks.",
      target: null,
      tabTarget: 'overview',
      tabLabel: 'Overview',
      position: 'center'
    },
    {
      title: "This Week ✅",
      body: "Your daily driver. Every task for the week is listed here — check them off as you go. The progress bar fills up as your week completes.",
      target: null,
      tabTarget: 'weekly',
      tabLabel: 'This Week',
      position: 'center'
    },
    {
      title: "Meal Plan 🥗",
      body: "Four meal templates based on your day type — Run Day, Calisthenics, Rest, and Long Run. Tailored to your weight, climate, and dietary preference.",
      target: null,
      tabTarget: 'nutrition',
      tabLabel: 'Meal Plan',
      position: 'center'
    },
    {
      title: "Milestones 🏅",
      body: "Tap a milestone to check it off when you hit it. These are your long-range checkpoints, from your first 5K to race day.",
      target: null,
      tabTarget: 'milestones',
      tabLabel: 'Milestones',
      position: 'center'
    },
    {
      title: "Run Log + Pace Calculator 🏃",
      body: "Log every run here. Enter distance and time and your pace is calculated automatically. Every logged run shows your split so you can track improvement over time.",
      target: null,
      tabTarget: 'log',
      tabLabel: 'Run Log',
      position: 'center'
    },
    {
      title: "Training Guide 📖",
      body: "Your reference hub — push-up and pull-up progressions, pace strategy, running form tips, and South FL nutrition rules.",
      target: null,
      tabTarget: 'guide',
      tabLabel: 'Guide',
      position: 'center'
    },
    {
      title: "Your Profile 👤",
      body: "Tap your name in the header to update weight, pace, race date, and more. The app recalculates everything automatically when you save.",
      target: '#profile-btn',
      tab: null,
      position: 'below'
    },
    {
      title: "Cloud Sync ☁️",
      body: "Tap the sync button to log in. When signed in, every checkbox, run, and note saves instantly across all your devices.",
      target: '#sync-btn',
      tab: null,
      position: 'below'
    },
    {
      title: "You're all set! 🎯",
      body: "Everything is ready. Head to 'This Week' and check off your first day. One week at a time.",
      target: null,
      tab: null,
      position: 'center'
    }
  ],

  currentStep: 0,

  shouldShow: function() {
    return !localStorage.getItem(TOUR_SKIP_KEY);
  },

  // Called from outside — shows the prompt card first
  show: function() {
    this.currentStep = 0;
    this._createOverlay();
    this._renderStep();
  },

  // Called from profile modal "Take a Tour" button — skips prompt, goes straight to step 1
  showDirect: function() {
    this.currentStep = 1;
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
  },

  _switchTab: function(tabId) {
    if (tabId && typeof setTab === 'function') {
      setTab(tabId);
    }
  },

  _getTabButtonTarget: function(tabLabel) {
    // Find the actual tab button by its text content
    const buttons = document.querySelectorAll('.tab-bar button');
    for (const btn of buttons) {
      if (btn.textContent.trim() === tabLabel) return btn;
    }
    return null;
  },

  _renderStep: function() {
    const step = this.steps[this.currentStep];
    const overlay = document.getElementById('tour-overlay');
    if (!overlay) return;

    // Switch to the relevant tab if this step has one
    if (step.tabTarget) {
      this._switchTab(step.tabTarget);
    }

    // After tab switch, wait one frame for DOM to update before measuring
    requestAnimationFrame(() => {
      this._renderStepDOM(step, overlay);
    });
  },

  _renderStepDOM: function(step, overlay) {
    const isLast = this.currentStep === this.steps.length - 1;
    const isFirst = this.currentStep === 0;
    const progress = Math.max(0, this.currentStep);
    const total = this.steps.length - 1; // Don't count prompt in progress

    // Resolve target element — tab steps highlight the tab button
    let targetEl = null;
    if (step.tabLabel) {
      targetEl = this._getTabButtonTarget(step.tabLabel);
    } else if (step.target) {
      targetEl = document.querySelector(step.target);
    }

    let cardStyle = '';
    let clipPath = '';

    if (targetEl && !step.isPrompt) {
      const rect = targetEl.getBoundingClientRect();
      const pad = 6;
      const top    = rect.top    - pad;
      const left   = rect.left   - pad;
      const right  = rect.right  + pad;
      const bottom = rect.bottom + pad;
      const W = window.innerWidth;
      const H = window.innerHeight;

      // clip-path polygon that cuts a transparent hole around the target
      // Outer rectangle minus the inner spotlight rectangle
      clipPath = `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${left/W*100}% ${top/H*100}%,
        ${left/W*100}% ${bottom/H*100}%,
        ${right/W*100}% ${bottom/H*100}%,
        ${right/W*100}% ${top/H*100}%,
        ${left/W*100}% ${top/H*100}%
      )`;

      // Position card below the spotlight, centered
      const cardTopPx = Math.min(bottom + 16, window.innerHeight - 260);
      cardStyle = `position:fixed;top:${cardTopPx}px;left:50%;transform:translateX(-50%);`;
    } else {
      clipPath = '';
      cardStyle = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);`;
    }

    // Build the backdrop with cutout
    const backdropStyle = clipPath
      ? `clip-path:${clipPath};`
      : '';

    // Build spotlight border ring (purely decorative — sits on top)
    let ringHTML = '';
    if (targetEl && !step.isPrompt) {
      const rect = targetEl.getBoundingClientRect();
      const pad = 6;
      ringHTML = `<div class="tour-ring" style="
        top:${rect.top - pad}px;
        left:${rect.left - pad}px;
        width:${rect.width + pad*2}px;
        height:${rect.height + pad*2}px;
      "></div>`;
    }

    // Prompt step — Yes / No layout
    if (step.isPrompt) {
      overlay.innerHTML = `
        <div class="tour-backdrop"></div>
        <div class="tour-card" style="${cardStyle}">
          <div class="tour-logo">🏃</div>
          <h3 class="tour-title" style="text-align:center">${step.title}</h3>
          <p class="tour-body" style="text-align:center">${step.body}</p>
          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px">
            <button class="tour-btn tour-btn-primary" onclick="MarathonTour.startTour()">Yes, show me around</button>
            <button class="tour-btn tour-btn-ghost" onclick="MarathonTour.declineTour()">No thanks</button>
          </div>
          <div class="tour-dont-show">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;justify-content:center">
              <input type="checkbox" id="tour-suppress" style="accent-color:#4ade80">
              <span>Don't show this again</span>
            </label>
          </div>
        </div>
      `;
      return;
    }

    // Regular tour step
    overlay.innerHTML = `
      <div class="tour-backdrop" style="${backdropStyle}"></div>
      ${ringHTML}
      <div class="tour-card" style="${cardStyle}">
        <div class="tour-progress-bar">
          <div class="tour-progress-fill" style="width:${(progress/total)*100}%"></div>
        </div>
        <div class="tour-step-count">${progress} of ${total}</div>
        <h3 class="tour-title">${step.title}</h3>
        <p class="tour-body">${step.body}</p>
        <div class="tour-actions">
          <div class="tour-left-actions">
            ${this.currentStep > 1 ? `<button class="tour-btn tour-btn-ghost" onclick="MarathonTour.prev()">← Back</button>` : ''}
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

  startTour: function() {
    this._checkSuppressFlag();
    this.currentStep = 1;
    this._renderStep();
  },

  declineTour: function() {
    this._checkSuppressFlag();
    this.close();
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
    if (this.currentStep > 1) {
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
