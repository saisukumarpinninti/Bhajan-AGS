// Replace these values with the settings from Firebase Console > Project settings > Your apps.
// Firebase web app config is public; never put service account keys or private credentials here.
export const firebaseConfig = {
  apiKey: "AIzaSyBbjhcPGxtkZpZMzhR1s-r4PpXwbJhCZws",
  authDomain: "bhajan-ags.firebaseapp.com",
  projectId: "bhajan-ags",
  storageBucket: "bhajan-ags.firebasestorage.app",
  messagingSenderId: "158198793235",
  appId: "1:158198793235:web:e9c934969f1f3ff1762be6",
  measurementId: "G-0PN869NQ84"
};

// Used as the Firestore path segment by the app, not the Firebase web app ID.
export const appId = 'bhajan-ags';

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' &&
  firebaseConfig.appId !== 'YOUR_FIREBASE_APP_ID';
