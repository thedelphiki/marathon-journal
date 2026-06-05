// --- FIREBASE CONFIGURATION ---

const firebaseConfig = {
  apiKey: "AIzaSyD-2LVzXPnxiqQ4020epujY-rOE6ePpbDI",
  authDomain: "marathon-journal-4114a.firebaseapp.com",
  projectId: "marathon-journal-4114a",
  storageBucket: "marathon-journal-4114a.firebasestorage.app",
  messagingSenderId: "696436218839",
  appId: "1:696436218839:web:418c44a72cc8bf8ed14992",
  measurementId: "G-48CFCLZ6LS"
};

let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    isFirebaseConfigured = true;
    console.log("✓ Firebase initialized.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// App Check — only activate if the SDK loaded successfully
if (isFirebaseConfigured) {
  try {
    if (typeof firebase.appCheck === 'function') {
      const appCheck = firebase.appCheck();
      appCheck.activate('6LdOnQYtAAAAAF1QJWEQv2ZfCuUDnU-S5fof9iJ0', true);
      console.log("✓ App Check activated.");
    } else {
      console.warn("App Check SDK not loaded — skipping activation.");
    }
  } catch (e) {
    console.warn("App Check activation failed (non-fatal):", e.message);
  }
}

window.isFirebaseConfigured = isFirebaseConfigured;
