// Re-exporting centralized Firebase configuration from shared/common_frontend
// This ensures lp_app uses the same configuration and initialization logic as other apps.

import { db, auth, functions } from '@shared/src/core/firebaseConfig';
import { getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Since Firebase is already initialized by the shared config, we can safely get the app instance
const app = getApp();

// Initialize Analytics (Web only, conditionally)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('[Firebase] Analytics initialized via shared app instance');
  }
}).catch((e) => {
  console.warn('[Firebase] Analytics not supported in this environment:', e);
});

export { app, auth, functions, db, analytics };
