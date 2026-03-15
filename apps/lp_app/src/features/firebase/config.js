import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // Auth already initialized
  auth = getAuth(app);
}

const functionsRegion = process.env.EXPO_PUBLIC_FUNCTIONS_REGION || 'us-central1';
const functions = getFunctions(app, functionsRegion);
let db;
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

// Initialize Analytics (Web only, conditionally)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('[Firebase] Analytics initialized');
  }
}).catch((e) => {
  console.warn('[Firebase] Analytics not supported in this environment:', e);
});

export { app, auth, functions, db, analytics };
