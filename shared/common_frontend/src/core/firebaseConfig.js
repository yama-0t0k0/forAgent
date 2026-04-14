/**
 * Firebase Configuration
 * Initializes Firebase app and exports Firestore instance.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getAuth, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Platform constants to satisfy Convention 3.1 (Shared UI/Logic Conventions)
const PLATFORM_WEB = 'web';

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
let persistence = null;

if (Platform.OS === PLATFORM_WEB) {
  persistence = browserLocalPersistence;
} else {
  const { getReactNativePersistence } = require('firebase/auth');
  persistence = getReactNativePersistence(ReactNativeAsyncStorage);
}


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
  const firestoreSettings = Platform.OS === PLATFORM_WEB
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


// Connect to Emulators during development if explicitly requested
const ENV_TRUE = 'true';
const useEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === ENV_TRUE;
if (__DEV__ && useEmulator) {
  try {
    // Note: use '10.0.2.2' for Android emulator if necessary, but 'localhost' works for web/iOS
    const host = 'localhost';
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
    console.log('🧪 [FirebaseConfig] Connected to Firebase Emulators');
  } catch (e) {
    console.log('ℹ️ [FirebaseConfig] Emulators already connected or connection failed');
  }
} else if (__DEV__) {
  console.log('🔥 [FirebaseConfig] Connected to PRODUCTION Firebase (Dev Mode)');
}

export { db, auth, functions };
