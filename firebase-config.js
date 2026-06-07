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

window.isFirebaseConfigured = false;

try {
  firebase.initializeApp(firebaseConfig);
  window.isFirebaseConfigured = true;

  // App Check — only if SDK loaded
  if (typeof firebase.appCheck === 'function') {
    firebase.appCheck().activate('6LdOnQYtAAAAAF1QJWEQv2ZfCuUDnU-S5fof9iJ0', true);
  }
} catch(e) {
  console.warn('Firebase init failed:', e.message);
}
