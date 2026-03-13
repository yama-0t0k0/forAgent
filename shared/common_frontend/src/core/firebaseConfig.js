/**
 * Firebase Configuration
 * Initializes Firebase app and exports Firestore instance.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Singleton pattern for Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Singleton pattern for Firebase Auth with persistence
let auth = null;
const persistence = Platform.select({
  web: browserLocalPersistence,
  default: getReactNativePersistence(ReactNativeAsyncStorage)
});

try {
  auth = initializeAuth(app, {
    persistence: persistence
  });
  console.log('✅ [FirebaseConfig] Auth initialized with persistence:', Platform.OS);
} catch (e) {
  // If already initialized (common in Fast Refresh), just get the existing instance
  auth = getAuth(app);
  console.log('ℹ️ [FirebaseConfig] Auth already initialized or failed, using existing instance.');
}

// Singleton pattern for Firestore
let db = null;
try {
  const firestoreSettings = Platform.OS === 'web'
    ? {}
    : {
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      };
  db = initializeFirestore(app, firestoreSettings);
} catch (e) {
  db = getFirestore(app);
}

const functionsRegion = process.env.EXPO_PUBLIC_FUNCTIONS_REGION || 'us-central1';
const functions = getFunctions(app, functionsRegion);

export { db, auth, functions };
