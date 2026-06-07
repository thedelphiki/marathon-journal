// --- LANDING PAGE ---
// Simple linear flow:
// 1. Page loads → landing shows immediately (no waiting for Firebase)
// 2. Firebase resolves auth state in background
// 3. If remembered user → go to app automatically
// 4. Otherwise → user must log in or start new journey

const REMEMBER_KEY = 'road2262_remember_v1';

// ── RENDER LANDING ────────────────────────────────────────────────
function showLanding() {
  const el = document.getElementById('landing-page');
  const app = document.getElementById('app');
  if (el) el.style.display = 'flex';
  if (app) app.style.display = 'none';
  document.body.classList.add('landing-open');

  el.innerHTML = `
    <div class="ld-wrap">
      <div class="ld-hero">
        <div class="ld-logo">🏃</div>
        <h1 class="ld-title">Road to 26.2</h1>
        <p class="ld-tagline">A personalized training journal for every kind of runner — from first steps to finish lines.</p>
        <div class="ld-pills">
          <span>✅ Daily checklists</span>
          <span>🗺️ Training phases</span>
          <span>🥗 Nutrition guidance</span>
          <span>☁️ Cloud sync</span>
        </div>
      </div>

      <div class="ld-card" id="ld-main-card">
        <button class="ld-btn" onclick="showLandingLogin()">Log In</button>
        <button class="ld-btn-outline" onclick="startNewJourney()">Take Your First Step →</button>
      </div>

      <button class="ld-guest-link" onclick="continueAsGuest()">
        Continue without an account
      </button>
    </div>
  `;
}

function showLandingLogin() {
  const card = document.getElementById('ld-main-card');
  if (!card) return;
  const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
  card.innerHTML = `
    <div id="ld-status" style="display:none;font-size:13px;margin-bottom:12px;padding:8px 10px;border-radius:6px;background:#060a12;border:1px solid #1e293b"></div>
    <div style="margin-bottom:14px">
      <label class="ld-label">Email</label>
      <input type="email" id="ld-email" class="ld-input" placeholder="runner@example.com" autocomplete="email">
    </div>
    <div style="margin-bottom:14px">
      <label class="ld-label">Password</label>
      <input type="password" id="ld-password" class="ld-input" placeholder="••••••••" autocomplete="current-password">
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;font-size:12px;font-family:system-ui">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#64748b">
        <input type="checkbox" id="ld-remember" style="accent-color:#4ade80" ${remembered ? 'checked' : ''}>
        Remember me
      </label>
      <a onclick="forgotPassword()" style="color:#475569;cursor:pointer;text-decoration:underline">Forgot password?</a>
    </div>
    <button class="ld-btn" onclick="submitLogin()">Log In</button>
    <button class="ld-btn-back" onclick="showLanding()">← Back</button>
  `;
  document.getElementById('ld-email').focus();
}

function showLandingStatus(msg, isError) {
  const el = document.getElementById('ld-status');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = isError ? '#f87171' : '#4ade80';
  el.style.borderColor = isError ? '#7f1d1d' : '#14532d';
  el.textContent = msg;
}

function submitLogin() {
  const email = (document.getElementById('ld-email') || {}).value || '';
  const password = (document.getElementById('ld-password') || {}).value || '';
  const remember = (document.getElementById('ld-remember') || {}).checked || false;

  if (!email || !password) { showLandingStatus('Please enter your email and password.', true); return; }
  if (!window.isFirebaseConfigured) { showLandingStatus('Authentication unavailable.', true); return; }

  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');

  const persistence = remember
    ? firebase.auth.Auth.Persistence.LOCAL
    : firebase.auth.Auth.Persistence.SESSION;

  showLandingStatus('Signing in...', false);

  firebase.auth().setPersistence(persistence)
    .then(() => firebase.auth().signInWithEmailAndPassword(email, password))
    .then(cred => {
      showLandingStatus('✓ Welcome back!', false);
      setTimeout(() => launchApp(cred.user), 600);
    })
    .catch(err => {
      const msgs = {
        'auth/user-not-found':    'No account found with that email.',
        'auth/wrong-password':    'Incorrect password.',
        'auth/invalid-credential':'Incorrect email or password.',
        'auth/invalid-email':     'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts — please wait a moment.',
      };
      showLandingStatus(msgs[err.code] || err.message, true);
    });
}

function forgotPassword() {
  const email = (document.getElementById('ld-email') || {}).value || '';
  if (!email) { showLandingStatus('Enter your email above first.', true); return; }
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => showLandingStatus('✓ Reset email sent — check your inbox.', false))
    .catch(err => showLandingStatus(err.message, true));
}

function startNewJourney() {
  launchApp(null);
  setTimeout(() => {
    if (window.MarathonOnboarding) MarathonOnboarding.showStep0();
  }, 200);
}

function continueAsGuest() {
  localStorage.setItem(REMEMBER_KEY, 'false');
  launchApp(null);
  setTimeout(() => {
    if (window.MarathonOnboarding && MarathonOnboarding.isIncomplete()) {
      MarathonOnboarding.showStep0();
    }
  }, 200);
}

// ── LAUNCH APP ────────────────────────────────────────────────────
function launchApp(user) {
  // Hide landing, show app
  const landing = document.getElementById('landing-page');
  const app = document.getElementById('app');
  if (landing) landing.style.display = 'none';
  if (app) app.style.display = 'block';
  document.body.classList.remove('landing-open');

  // Wire up user
  if (user && window.MarathonAuth) MarathonAuth.currentUser = user;
  if (window.MarathonDB && user) MarathonDB.handleUserChange(user);

  // Render app
  if (typeof render === 'function') render();

  // Post-login: tour for returning users with complete profiles
  if (user) {
    setTimeout(() => {
      if (window.MarathonAuth) MarathonAuth.updateModalUI();
      if (window.MarathonTour && MarathonTour.shouldShow() &&
          window.MarathonOnboarding && !MarathonOnboarding.isIncomplete()) {
        MarathonTour.show();
      }
    }, 500);
  }
}

// ── INIT ─────────────────────────────────────────────────────────
// Called at the bottom of index.html after all scripts load.
// Always show landing first, then silently check for a remembered session.
(function init() {
  // Show landing immediately — no waiting
  showLanding();

  // If Firebase ready, check for a remembered logged-in session
  if (window.isFirebaseConfigured) {
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    if (remembered) {
      // Check auth state once — if already logged in, skip landing
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe(); // only need the first call
        if (user) {
          // Valid remembered session — go straight to app
          launchApp(user);
        }
        // No user — landing is already showing, nothing to do
      });
    }
  }
})();

// Expose for auth.js modal logout to redirect back to landing
window.showLanding = showLanding;
window.launchApp   = launchApp;
