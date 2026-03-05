import { logEvent, setUserId, setUserProperties, isSupported, getAnalytics } from 'firebase/analytics';
import { app } from '../firebase/config';

// Re-initialize locally if needed or rely on config (config.js exports analytics binding)
// But for reliability, let's get the instance if supported here too, or just use the app instance.
// Using getAnalytics(app) is safe if isSupported() is true.

let analyticsInstance = null;

// Initialize analytics instance safely
const getAnalyticsSafe = async () => {
    if (analyticsInstance) return analyticsInstance;
    
    try {
        const supported = await isSupported();
        if (supported) {
            analyticsInstance = getAnalytics(app);
            return analyticsInstance;
        } else {
            console.log('[Analytics] Not supported in this environment');
            return null;
        }
    } catch (e) {
        console.warn('[Analytics] Initialization failed:', e);
        return null;
    }
};

/**
 * Log a screen view event
 * @param {string} screenName - The name of the screen
 * @param {string} [screenClass] - The class/category of the screen (defaults to screenName)
 */
export const logScreenView = async (screenName, screenClass) => {
    try {
        const analytics = await getAnalyticsSafe();
        if (analytics) {
            await logEvent(analytics, 'screen_view', {
                firebase_screen: screenName,
                firebase_screen_class: screenClass || screenName,
            });
            console.log(`[Analytics] Screen View: ${screenName}`);
        }
    } catch (e) {
        console.warn('[Analytics] Failed to log screen view:', e);
    }
};

/**
 * Log a custom event
 * @param {string} eventName - The name of the event
 * @param {object} [params] - Event parameters
 */
export const logCustomEvent = async (eventName, params = {}) => {
    try {
        const analytics = await getAnalyticsSafe();
        if (analytics) {
            await logEvent(analytics, eventName, params);
            console.log(`[Analytics] Event: ${eventName}`, params);
        }
    } catch (e) {
        console.warn('[Analytics] Failed to log event:', e);
    }
};

/**
 * Set the User ID
 * @param {string} userId - The user ID
 */
export const setAnalyticsUser = async (userId) => {
    try {
        const analytics = await getAnalyticsSafe();
        if (analytics) {
            await setUserId(analytics, userId);
            console.log(`[Analytics] User ID set: ${userId}`);
        }
    } catch (e) {
        console.warn('[Analytics] Failed to set user ID:', e);
    }
};

/**
 * Set User Properties
 * @param {object} properties - Key-value pairs of user properties
 */
export const setAnalyticsUserProperties = async (properties) => {
    try {
        const analytics = await getAnalyticsSafe();
        if (analytics) {
            await setUserProperties(analytics, properties);
            console.log(`[Analytics] User Properties set:`, properties);
        }
    } catch (e) {
        console.warn('[Analytics] Failed to set user properties:', e);
    }
};
