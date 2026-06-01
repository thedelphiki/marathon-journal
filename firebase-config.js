// --- FIREBASE CONFIGURATION TEMPLATE ---
// You will replace these placeholder strings with your actual Firebase Web App keys in a later step.

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

// Safe initialization checker
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    isFirebaseConfigured = true;
    console.log("✓ Firebase successfully initialized.");
  } else {
    console.warn("⚠ Firebase is in Offline mode. Please fill in your keys in 'firebase-config.js' to enable cloud sync.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}
if (isFirebaseConfigured) {
  const appCheck = firebase.appCheck();
  appCheck.activate('6LdOnQYtAAAAAF1QJWEQv2ZfCuUDnU-S5fof9iJ0', true);
}
// Make configuration status accessible globally
window.isFirebaseConfigured = isFirebaseConfigured;
