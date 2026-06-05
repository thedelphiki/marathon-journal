// --- FIREBASE AUTHENTICATION UTILITIES ---

const MarathonAuth = {
  currentUser: null,
  isSignUpMode: false,

  // UI Dialog Controls
  showSyncModal: function() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.add('active');
    this.updateModalUI();
  },

  hideSyncModal: function() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  toggleAuthMode: function() {
    this.isSignUpMode = !this.isSignUpMode;
    this.updateModalUI();
  },

  // Update elements dynamically based on connection, login, or registration state
  updateModalUI: function() {
    const title        = document.getElementById('auth-title');
    const subtitle     = document.getElementById('auth-subtitle');
    const form         = document.getElementById('auth-form');
    const loggedInState= document.getElementById('auth-logged-in-state');
    const switchDiv    = document.getElementById('auth-switch');
    const submitBtn    = document.getElementById('auth-btn');
    const statusDiv    = document.getElementById('auth-status');
    const infoAlert    = document.getElementById('auth-info');

    if (statusDiv) { statusDiv.style.display = 'none'; statusDiv.textContent = ''; }

    // CASE 1: User is already logged in — show account info + sign out
    if (this.currentUser) {
      if (title)       title.textContent  = 'Your Account';
      if (subtitle)    subtitle.textContent = 'Cloud sync is active. Your progress saves across all devices.';
      if (form)        form.style.display  = 'none';
      if (loggedInState) loggedInState.style.display = 'block';
      if (switchDiv)   switchDiv.style.display = 'none';
      if (infoAlert)   infoAlert.style.display = 'none';
      const emailDisplay = document.getElementById('auth-user-email');
      if (emailDisplay) emailDisplay.textContent = this.currentUser.email;
      return;
    }

    // CASE 2: Guest or logged-out user — show login/signup form
    if (form)        form.style.display  = 'block';
    if (loggedInState) loggedInState.style.display = 'none';
    if (switchDiv)   switchDiv.style.display = 'block';
    if (infoAlert) {
      infoAlert.style.display = 'block';
      infoAlert.style.background = 'rgba(74,222,128,0.07)';
      infoAlert.style.border  = '1px solid rgba(74,222,128,0.2)';
      infoAlert.style.color   = '#86efac';
      infoAlert.innerHTML     = '💡 <strong>Any progress made as a guest</strong> will be merged into your account when you log in or sign up.';
    }

    if (this.isSignUpMode) {
      if (title)     title.textContent     = 'Create Account';
      if (subtitle)  subtitle.textContent  = 'Sign up to sync your training across all your devices.';
      if (submitBtn) submitBtn.textContent = 'Create Account';
      if (switchDiv) switchDiv.innerHTML   = `Already have an account? <a class="auth-switch-link" onclick="window.MarathonAuth.toggleAuthMode()">Log In</a>`;
      const hint = document.getElementById('auth-password-hint');
      if (hint) hint.style.display = 'block';
    } else {
      if (title)     title.textContent     = 'Log In';
      if (subtitle)  subtitle.textContent  = 'Welcome back — your data will sync automatically.';
      if (submitBtn) submitBtn.textContent = 'Log In';
      if (switchDiv) switchDiv.innerHTML   = `Don't have an account? <a class="auth-switch-link" onclick="window.MarathonAuth.toggleAuthMode()">Sign Up</a>`;
      const hint = document.getElementById('auth-password-hint');
      if (hint) hint.style.display = 'none';
    }
  },

  // Handle Form Submissions (Login & Signup)
  handleAuthSubmit: function(event) {
    event.preventDefault();
    if (!window.isFirebaseConfigured) {
      // Firebase not set up — shouldn't happen in production but handle gracefully
      const statusDiv = document.getElementById('auth-status');
      if (statusDiv) { statusDiv.style.display='block'; statusDiv.style.color='#f87171'; statusDiv.textContent='Authentication is not available right now.'; }
      return;
    }

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const statusDiv = document.getElementById('auth-status');
    const submitBtn = document.getElementById('auth-btn');

    statusDiv.style.display = 'block';
    statusDiv.style.color = '#cbd5e1';
    statusDiv.textContent = this.isSignUpMode ? "Creating account..." : "Signing in...";
    submitBtn.disabled = true;

    if (this.isSignUpMode) {
      // Enforce password strength before sending to Firebase
      if (password.length < 8) {
        statusDiv.style.color = '#f87171';
        statusDiv.textContent = 'Password must be at least 8 characters.';
        submitBtn.disabled = false;
        return;
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        statusDiv.style.color = '#f87171';
        statusDiv.textContent = 'Password must include at least one uppercase letter and one number.';
        submitBtn.disabled = false;
        return;
      }
      // Create New Account
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          statusDiv.style.color = '#4ade80';
          statusDiv.textContent = "Account created successfully!";
          setTimeout(() => {
            this.hideSyncModal();
            // Data merge will trigger in db.js upon auth state change
          }, 1500);
        })
        .catch((error) => {
          statusDiv.style.color = '#f87171';
          statusDiv.textContent = error.message;
          submitBtn.disabled = false;
        });
    } else {
      // Sign In Existing User
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          statusDiv.style.color = '#4ade80';
          statusDiv.textContent = "Logged in successfully!";
          setTimeout(() => {
            this.hideSyncModal();
          }, 1500);
        })
        .catch((error) => {
          statusDiv.style.color = '#f87171';
          statusDiv.textContent = error.message;
          submitBtn.disabled = false;
        });
    }
  },

  // Password Reset Facility
  handleForgotPassword: function() {
    if (!window.isFirebaseConfigured) return;
    const emailInput = document.getElementById('auth-email');
    const email = emailInput.value.trim();
    const statusDiv = document.getElementById('auth-status');

    if (!email) {
      statusDiv.style.display = 'block';
      statusDiv.style.color = '#f87171';
      statusDiv.textContent = "Please enter your email address in the field above to reset your password.";
      emailInput.focus();
      return;
    }

    statusDiv.style.display = 'block';
    statusDiv.style.color = '#cbd5e1';
    statusDiv.textContent = "Sending reset email...";

    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        statusDiv.style.color = '#4ade80';
        statusDiv.textContent = "✓ Password reset email sent! Check your inbox.";
      })
      .catch((error) => {
        statusDiv.style.color = '#f87171';
        statusDiv.textContent = error.message;
      });
  },

  // Sign Out Handler
  handleLogout: function() {
    if (!window.isFirebaseConfigured) return;
    
    if (confirm("Are you sure you want to sign out? Your cloud data is safe, and we will temporarily return to local offline storage.")) {
      firebase.auth().signOut()
        .then(() => {
          this.hideSyncModal();
          // Reload page to wipe memory and pull local storage
          window.location.reload();
        })
        .catch((error) => {
          alert("Error signing out: " + error.message);
        });
    }
  }
};

// --- INITIALIZE AUTH OBSERVER ---
// Called explicitly by MarathonLanding after it has initialized,
// so isVisible is guaranteed true before onAuthStateChanged fires.
MarathonAuth.initObserver = function() {
  if (!window.isFirebaseConfigured) {
    MarathonAuth.updateModalUI();
    return;
  }

  let firstCall = true;
  console.log('[AUTH] initObserver() registered');

  firebase.auth().onAuthStateChanged((user) => {
    console.log('[AUTH] onAuthStateChanged fired. firstCall=', firstCall, 'user=', user ? user.email : 'null', 'isVisible=', window.MarathonLanding ? window.MarathonLanding.isVisible : 'NO_LANDING');
    const wasLoggedOut = !MarathonAuth.currentUser;
    MarathonAuth.currentUser = user;
    MarathonAuth.updateModalUI();

    if (window.MarathonDB && typeof window.MarathonDB.handleUserChange === 'function') {
      window.MarathonDB.handleUserChange(user);
    }

    // On the very first auth state resolution, let the landing page decide what to show
    if (firstCall) {
      firstCall = false;
      if (window.MarathonLanding) {
        if (user) {
          // Authenticated — go straight to app
          MarathonLanding._launchApp(user);
        } else {
          // Not authenticated — show landing
          MarathonLanding._show();
        }
      }
      return;
    }

    // Subsequent calls (login/logout events while app is running)
    if (!window.MarathonLanding || !window.MarathonLanding.isVisible) {
      if (typeof render === 'function') render();

      if (user && wasLoggedOut) {
        setTimeout(function() {
          if (window.MarathonOnboarding && MarathonOnboarding.isIncomplete()) {
            MarathonOnboarding.maybeShow();
          } else if (window.MarathonTour && MarathonTour.shouldShow()) {
            MarathonTour.show();
          }
        }, 600);
      }
    }
  });
};

// Bind to window to allow HTML triggers to hook in
window.MarathonAuth = MarathonAuth;
