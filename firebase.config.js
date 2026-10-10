// Replace these values with the settings from Firebase Console > Project settings > Your apps.
// Firebase web app config is public; never put service account keys or private credentials here.
export const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID',
};

// Used as the Firestore path segment by the app, not the Firebase web app ID.
export const appId = 'bhajan-ags';

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' &&
  firebaseConfig.appId !== 'YOUR_FIREBASE_APP_ID';
