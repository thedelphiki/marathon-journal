// --- FIREBASE FIRESTORE SYNC LAYER ---

const MarathonDB = {
  db: null,
  currentUser: null,
  firestoreListener: null,
  profileListener: null,
  syncDebounceTimeout: null,
  isSyncingFromCloud: false, // Prevents write loops when receiving cloud updates

  // Initialize database
  init: function() {
    if (window.isFirebaseConfigured) {
      this.db = firebase.firestore();
    }
  },

  // Called by auth.js on user login or logout
  handleUserChange: function(user) {
    this.currentUser = user;
    
    // Clean up any existing active snapshot listeners
    if (this.firestoreListener) {
      this.firestoreListener();
      this.firestoreListener = null;
    }
    if (this.profileListener) {
      this.profileListener();
      this.profileListener = null;
    }

    if (!user) {
      console.log("Database: User is offline. Using local storage.");
      return;
    }

    this.init();
    console.log("Database: Initializing cloud listeners for user:", user.uid);
    
    const userDocRef = this.db.collection('users').doc(user.uid).collection('journal').doc('data');
    const profileDocRef = this.db.collection('users').doc(user.uid).collection('profile').doc('data');

    // 1. Set up real-time listener to user's journal checklist and runs
    this.firestoreListener = userDocRef.onSnapshot((doc) => {
      if (doc.exists) {
        console.log("✓ Cloud sync: Fresh journal data downloaded from Firestore.");
        this.isSyncingFromCloud = true;
        
        // Push cloud data to main app state and re-render
        if (typeof updateStateFromCloud === 'function') {
          updateStateFromCloud(doc.data());
        }
        
        this.isSyncingFromCloud = false;
      } else {
        // Document does not exist (New cloud user)
        console.log("Cloud sync: No cloud journal found. Merging local progress...");
        this.handleNewCloudUserMerge(userDocRef);
      }
    }, (error) => {
      console.error("Cloud sync snapshot error:", error);
    });

    // 2. Set up real-time listener to user's profile and biometrics
    this.profileListener = profileDocRef.onSnapshot((doc) => {
      if (doc.exists) {
        console.log("✓ Cloud sync: Fresh profile downloaded from Firestore.");
        this.isSyncingFromCloud = true;
        
        // Update local profile state
        if (window.MarathonProfile && typeof window.MarathonProfile.save === 'function') {
          window.MarathonProfile.state = { ...window.MarathonProfile.state, ...doc.data() };
          localStorage.setItem('road2262_profile_v1', JSON.stringify(window.MarathonProfile.state));
          window.MarathonProfile.updateCalculatedDefaults();
          
          if (typeof render === 'function') {
            render();
          }
        }
        
        this.isSyncingFromCloud = false;
      } else {
        console.log("Cloud sync: No cloud profile found. Initializing with local settings...");
        this.handleNewProfileMerge(profileDocRef);
      }
    }, (error) => {
      console.error("Profile sync snapshot error:", error);
    });
  },

  // Merging local progress into new cloud profiles
  handleNewCloudUserMerge: function(userDocRef) {
    if (typeof getLocalStateForSync !== 'function') return;

    const localState = getLocalStateForSync();
    
    // Check if the user has any substantial local progress
    const hasCheckedTasks = localState.checkedTasks && Object.keys(localState.checkedTasks).length > 0;
    const hasLogs = localState.runLog && localState.runLog.length > 0;
    const hasNotes = localState.notes && Object.keys(localState.notes).length > 0;
    const hasMilestones = localState.milestones && localState.milestones.some(m => m.done);

    if (hasCheckedTasks || hasLogs || hasNotes || hasMilestones) {
      console.log("Merging local logs and checklists into Firestore...");
      
      // Save current local state to cloud instantly
      userDocRef.set(localState)
        .then(() => {
          console.log("✓ Success: Local journal progress merged to cloud profile.");
          this.flashSyncStatus("✓ Local logs synced to Cloud!");
        })
        .catch((error) => {
          console.error("Failed to merge local progress to cloud:", error);
        });
    } else {
      console.log("Writing fresh journal state to cloud...");
      userDocRef.set(localState)
        .catch(err => console.error("Failed to write initial clean state:", err));
    }
  },

  // Merging local profile into new cloud profiles
  handleNewProfileMerge: function(profileDocRef) {
    if (!window.MarathonProfile) return;
    
    const localProfile = window.MarathonProfile.state;
    profileDocRef.set(localProfile)
      .then(() => {
        console.log("✓ Success: Local profile settings uploaded to cloud.");
        this.flashSyncStatus("✓ Profile synced to Cloud!");
      })
      .catch((error) => {
        console.error("Failed to upload local profile to cloud:", error);
      });
  },

  // Helper to flash sync confirmations in app.js UI
  flashSyncStatus: function(msg) {
    if (typeof render === 'function' && typeof STATE !== 'undefined') {
      STATE.saveMsg = msg;
      render();
      setTimeout(() => {
        STATE.saveMsg = "";
        render();
      }, 3000);
    }
  },

  // Sync local changes to cloud (Called by app.js when persist() runs)
  syncToCloud: function(stateData) {
    if (!this.currentUser || !this.db || this.isSyncingFromCloud) return;

    // Clear any pending syncs to debounce rapid inputs (e.g. checking multiple items in 1 second)
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }

    // Debounce saving for 1 second after the user's last action
    this.syncDebounceTimeout = setTimeout(() => {
      console.log("Cloud sync: Uploading state changes to Firestore...");
      
      const payload = {
        checkedTasks: stateData.checkedTasks || {},
        milestones: stateData.milestones || [],
        notes: stateData.notes || {},
        runLog: stateData.runLog || [],
        week: stateData.week || 1
      };

      const userDocRef = this.db.collection('users').doc(this.currentUser.uid).collection('journal').doc('data');

      userDocRef.set(payload)
        .then(() => {
          console.log("✓ Cloud sync: Successfully uploaded to Firestore.");
        })
        .catch((error) => {
          console.error("Cloud sync upload failed:", error);
        });
    }, 1000); // 1 second debounce
  },

  // Sync profile changes to cloud instantly (Called by profile.js when profile updates)
  syncProfileToCloud: function(profileData) {
    if (!this.currentUser || !this.db || this.isSyncingFromCloud) return;

    console.log("Cloud sync: Uploading profile updates to Firestore...");
    const profileDocRef = this.db.collection('users').doc(this.currentUser.uid).collection('profile').doc('data');

    profileDocRef.set(profileData)
      .then(() => {
        console.log("✓ Cloud sync: Profile saved to Firestore successfully.");
        this.flashSyncStatus("✓ Profile saved to Cloud!");
      })
      .catch((error) => {
        console.error("Cloud sync profile upload failed:", error);
      });
  }
};

// Bind to window to allow app.js/auth.js/profile.js triggers
window.MarathonDB = MarathonDB;
