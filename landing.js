// --- LANDING PAGE ---
// Shown to every visitor before the app loads.
// Handles login, signup, guest access, and "Remember Me" persistence.
// "Remember Me" unchecked = session-only auth (clears on tab/browser close).
// "Remember Me" checked   = persistent auth (stays logged in across sessions).

const REMEMBER_KEY = 'road2262_remember_v1';

const MarathonLanding = {

  // Set true immediately at parse time — before DOMContentLoaded fires on any script.
  // This ensures onboarding/tour guards work even during the async auth check.
  isVisible: true,

  // Called on DOMContentLoaded — decides whether to show landing or go straight to app
  init: function() {
    // isVisible is true at module level — blocks onboarding before we're ready.

    // If Firebase not configured, skip landing entirely
    if (!window.isFirebaseConfigured) {
      this.isVisible = false;
      this._launchApp();
      return;
    }

    // Set Firebase persistence based on Remember Me preference, then start auth observer.
    // initObserver handles _show() vs _launchApp() on first auth resolution.
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    const persistence = remembered
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    firebase.auth().setPersistence(persistence).then(() => {
      if (window.MarathonAuth && typeof MarathonAuth.initObserver === 'function') {
        MarathonAuth.initObserver();
      }
    }).catch(() => {
      // If persistence fails, still start the observer
      if (window.MarathonAuth && typeof MarathonAuth.initObserver === 'function') {
        MarathonAuth.initObserver();
      }
    });
  },

  _show: function() {
    this.isVisible = true;
    const landing = document.getElementById('landing-page');
    const appEl   = document.getElementById('app');
    if (landing) landing.style.display = 'flex';
    if (appEl)   appEl.style.display   = 'none';
    this._render();
  },

  _hide: function() {
    this.isVisible = false;
    const landing = document.getElementById('landing-page');
    const appEl   = document.getElementById('app');
    if (landing) landing.style.display = 'none';
    if (appEl)   appEl.style.display   = 'block';
  },

  _launchApp: function(user) {
    this._hide();
    // Pass user to auth system
    if (user && window.MarathonAuth) {
      MarathonAuth.currentUser = user;
    }
    // Init the main app
    if (typeof render === 'function') render();
    // Trigger onboarding or tour
    setTimeout(() => {
      if (user) {
        if (window.MarathonOnboarding && MarathonOnboarding.isIncomplete()) {
          MarathonOnboarding.maybeShow();
        } else if (window.MarathonTour && MarathonTour.shouldShow()) {
          MarathonTour.show();
        }
      } else {
        // Guest — go through onboarding
        if (window.MarathonOnboarding) MarathonOnboarding.maybeShow();
      }
    }, 400);
  },

  _render: function() {
    const el = document.getElementById('landing-inner');
    if (!el) return;

    el.innerHTML = `
      <div class="ld-hero">
        <div class="ld-logo">🏃</div>
        <h1 class="ld-title">Road to 26.2</h1>
        <p class="ld-tagline">A personalized training journal for every kind of runner —<br>from first steps to finish lines.</p>
        <div class="ld-features">
          <span>✅ Daily checklists</span>
          <span>🗺️ Phased training plans</span>
          <span>🥗 Nutrition guidance</span>
          <span>☁️ Cloud sync</span>
        </div>
      </div>

      <div id="ld-card">
        <div class="ld-entry-btns">
          <button class="ld-btn" onclick="MarathonLanding.showLogin()">Log In</button>
          <button class="ld-btn-outline" onclick="MarathonLanding.showSignup()">Take Your First Step →</button>
        </div>
      </div>

      <button class="ld-guest" onclick="MarathonLanding.continueAsGuest()">
        Continue without an account
      </button>
    `;
  },

  showLogin: function() {
    const card = document.getElementById('ld-card');
    if (card) {
      card.innerHTML = this._loginForm('login');
      // Scroll to form smoothly on mobile
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  showSignup: function() {
    // New user — skip login form, go straight to onboarding
    this._launchApp(null);
    setTimeout(() => {
      if (window.MarathonOnboarding) MarathonOnboarding.maybeShow();
    }, 300);
  },

  _loginForm: function(mode) {
    mode = mode || 'login';
    const isSignup = mode === 'signup';
    return `
      <div class="ld-tabs">
        <button class="ld-tab ${!isSignup ? 'active' : ''}" onclick="MarathonLanding.setMode('login')">Log In</button>
        <button class="ld-tab ${isSignup ? 'active' : ''}" onclick="MarathonLanding.setMode('signup')">New User</button>
      </div>

      <div id="ld-status" class="ld-status" style="display:none"></div>

      <form onsubmit="MarathonLanding.handleSubmit(event)">
        <div class="ld-field">
          <label class="ld-label">Email</label>
          <input type="email" id="ld-email" class="ld-input" placeholder="runner@example.com" required autocomplete="email">
        </div>
        <div class="ld-field">
          <label class="ld-label">Password</label>
          <input type="password" id="ld-password" class="ld-input" placeholder="••••••••" required autocomplete="${isSignup ? 'new-password' : 'current-password'}">
          ${isSignup ? `<div class="ld-hint">Min. 8 characters · one uppercase letter · one number</div>` : ''}
        </div>

        <div class="ld-remember">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="ld-remember" style="accent-color:#4ade80;width:15px;height:15px"
              ${localStorage.getItem(REMEMBER_KEY) === 'true' ? 'checked' : ''}>
            <span>Remember me</span>
          </label>
          ${!isSignup ? `<a class="ld-forgot" onclick="MarathonLanding.forgotPassword()">Forgot password?</a>` : ''}
        </div>

        <button type="submit" class="ld-btn">
          ${isSignup ? 'Create Account' : 'Log In'}
        </button>

        ${isSignup ? `<p class="ld-terms">By creating an account you agree to use this app responsibly. All training recommendations are for informational purposes. Consult a physician before starting any new exercise program.</p>` : ''}
      </form>
    `;
  },

  setMode: function(mode) {
    const card = document.getElementById('ld-card');
    if (card) card.innerHTML = this._loginForm(mode);
  },

  handleSubmit: function(e) {
    e.preventDefault();
    const email    = document.getElementById('ld-email').value.trim();
    const password = document.getElementById('ld-password').value;
    const remember = document.getElementById('ld-remember').checked;
    const isSignup = document.querySelector('.ld-tab.active')?.textContent.trim() === 'New User';
    const status   = document.getElementById('ld-status');
    const btn      = e.target.querySelector('button[type="submit"]');

    // Save remember preference
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');

    // Set Firebase persistence
    const persistence = remember
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    status.style.display = 'block';
    status.style.color   = '#94a3b8';
    status.textContent   = isSignup ? 'Creating account...' : 'Signing in...';
    btn.disabled = true;

    if (isSignup) {
      // Password strength check
      if (password.length < 8) {
        status.style.color = '#f87171';
        status.textContent = 'Password must be at least 8 characters.';
        btn.disabled = false;
        return;
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        status.style.color = '#f87171';
        status.textContent = 'Password must include at least one uppercase letter and one number.';
        btn.disabled = false;
        return;
      }
    }

    firebase.auth().setPersistence(persistence).then(() => {
      const authCall = isSignup
        ? firebase.auth().createUserWithEmailAndPassword(email, password)
        : firebase.auth().signInWithEmailAndPassword(email, password);

      return authCall;
    }).then((cred) => {
      status.style.color = '#4ade80';
      status.textContent = isSignup ? '✓ Account created!' : '✓ Welcome back!';
      setTimeout(() => {
        if (window.MarathonAuth) MarathonAuth.currentUser = cred.user;
        if (window.MarathonDB && typeof MarathonDB.handleUserChange === 'function') {
          MarathonDB.handleUserChange(cred.user);
        }
        this._launchApp(cred.user);
      }, 800);
    }).catch((err) => {
      status.style.color = '#f87171';
      // Friendly error messages
      const msgs = {
        'auth/user-not-found':      'No account found with that email.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/email-already-in-use': 'An account with that email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/too-many-requests':    'Too many attempts. Please wait a moment and try again.',
        'auth/invalid-credential':   'Incorrect email or password.',
      };
      status.textContent = msgs[err.code] || err.message;
      btn.disabled = false;
    });
  },

  forgotPassword: function() {
    const email  = document.getElementById('ld-email')?.value.trim();
    const status = document.getElementById('ld-status');
    if (!email) {
      status.style.display = 'block';
      status.style.color   = '#f87171';
      status.textContent   = 'Enter your email above first.';
      return;
    }
    status.style.display = 'block';
    status.style.color   = '#94a3b8';
    status.textContent   = 'Sending reset email...';
    firebase.auth().sendPasswordResetEmail(email).then(() => {
      status.style.color = '#4ade80';
      status.textContent = '✓ Reset email sent — check your inbox.';
    }).catch((err) => {
      status.style.color = '#f87171';
      status.textContent = err.message;
    });
  },

  continueAsGuest: function() {
    localStorage.setItem(REMEMBER_KEY, 'false');
    this._launchApp(null);
  },

  // Called from handleSignOut in app.js — resets persistence and shows landing
  signOut: function() {
    localStorage.setItem(REMEMBER_KEY, 'false');
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
      return firebase.auth().signOut();
    }).then(() => {
      location.reload();
    }).catch(() => {
      location.reload();
    });
  }
};

window.MarathonLanding = MarathonLanding;
