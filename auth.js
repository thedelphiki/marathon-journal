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
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const form = document.getElementById('auth-form');
    const loggedInState = document.getElementById('auth-logged-in-state');
    const switchDiv = document.getElementById('auth-switch');
    const submitBtn = document.getElementById('auth-btn');
    const statusDiv = document.getElementById('auth-status');
    const infoAlert = document.getElementById('auth-info');

    // Reset status message
    if (statusDiv) {
      statusDiv.style.display = 'none';
      statusDiv.textContent = '';
    }

    // CASE 1: Firebase is NOT configured yet
    if (!window.isFirebaseConfigured) {
      if (title) title.textContent = "Database Setup Required";
      if (subtitle) subtitle.innerHTML = "To enable cloud sync, you first need to create a free Firebase project. We've set up the code for you — just follow the quick guide in our chat!";
      if (form) form.style.display = 'none';
      if (loggedInState) loggedInState.style.display = 'none';
      if (switchDiv) switchDiv.style.display = 'none';
      if (infoAlert) {
        infoAlert.style.background = 'rgba(234, 179, 8, 0.1)';
        infoAlert.style.border = '1px solid rgba(234, 179, 8, 0.2)';
        infoAlert.style.color = '#fef08a';
        infoAlert.innerHTML = `🔑 <strong>Next Step</strong>: Complete Phase 3 in our pairing chat to grab your config keys, paste them into <code>firebase-config.js</code>, and this sync window will instantly unlock!`;
      }
      return;
    }

    // Restore default alert styling
    if (infoAlert) {
      infoAlert.style.background = 'rgba(59, 130, 246, 0.1)';
      infoAlert.style.border = '1px solid rgba(59, 130, 246, 0.2)';
      infoAlert.style.color = '#93c5fd';
      infoAlert.innerHTML = `💡 <strong>Offline Progress Safe</strong>: Any logs or checkboxes currently on this device will be automatically merged into your cloud profile upon login.`;
    }

    // CASE 2: User is logged in
    if (this.currentUser) {
      if (title) title.textContent = "Syncing Active";
      if (subtitle) subtitle.textContent = "Your training journal is securely backed up and syncing in real-time across your devices.";
      if (form) form.style.display = 'none';
      if (loggedInState) loggedInState.style.display = 'block';
      if (switchDiv) switchDiv.style.display = 'none';
      
      const emailDisplay = document.getElementById('auth-user-email');
      if (emailDisplay) emailDisplay.textContent = this.currentUser.email;
      return;
    }

    // CASE 3: Firebase is active, user is logged out (Login vs Sign Up state)
    if (form) form.style.display = 'block';
    if (loggedInState) loggedInState.style.display = 'none';
    if (switchDiv) switchDiv.style.display = 'block';

    if (this.isSignUpMode) {
      if (title) title.textContent = "Create Cloud Account";
      if (subtitle) subtitle.textContent = "Sign up to sync your marathon log across all your devices.";
      if (submitBtn) submitBtn.textContent = "Create Account";
      if (switchDiv) switchDiv.innerHTML = `Already have an account? <a class="auth-switch-link" onclick="window.MarathonAuth.toggleAuthMode()">Log In</a>`;
      // Show password requirements hint
      const hint = document.getElementById('auth-password-hint');
      if (hint) hint.style.display = 'block';
    } else {
      if (title) title.textContent = "Cloud Sync Login";
      if (subtitle) subtitle.textContent = "Log in to load your saved checklists and runs.";
      if (submitBtn) submitBtn.textContent = "Log In";
      if (switchDiv) switchDiv.innerHTML = `Don't have an account? <a class="auth-switch-link" onclick="window.MarathonAuth.toggleAuthMode()">Sign Up</a>`;
      const hint = document.getElementById('auth-password-hint');
      if (hint) hint.style.display = 'none';
    }
  },

  // Handle Form Submissions (Login & Signup)
  handleAuthSubmit: function(event) {
    event.preventDefault();
    if (!window.isFirebaseConfigured) return;

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
document.addEventListener("DOMContentLoaded", () => {
  if (window.isFirebaseConfigured) {
    firebase.auth().onAuthStateChanged((user) => {
      const wasLoggedOut = !MarathonAuth.currentUser;
      MarathonAuth.currentUser = user;
      MarathonAuth.updateModalUI();

      if (window.MarathonDB && typeof window.MarathonDB.handleUserChange === 'function') {
        window.MarathonDB.handleUserChange(user);
      }

      // Only re-render and show tour if landing has already been dismissed
      // (Landing handles the initial auth flow itself)
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
  } else {
    MarathonAuth.updateModalUI();
  }
});

// Bind to window to allow HTML triggers to hook in
window.MarathonAuth = MarathonAuth;
