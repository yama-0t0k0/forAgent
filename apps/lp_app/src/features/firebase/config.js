import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

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
const auth = getAuth(app);
const functions = getFunctions(app, 'asia-northeast1');

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

const emulatorHost = typeof process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST === 'string'
    ? process.env.EXPO_PUBLIC_FUNCTIONS_EMULATOR_HOST.trim()
    : '';

if (__DEV__ && emulatorHost.length > 0) {
    connectFunctionsEmulator(functions, emulatorHost.split(':')[0], 5001);
}

export { app, auth, functions, analytics };
