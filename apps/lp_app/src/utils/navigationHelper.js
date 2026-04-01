import { Platform, Linking, Alert } from 'react-native';

const APP_URLS = {
  admin: process.env.EXPO_PUBLIC_ADMIN_APP_URL || 'https://admin-app-site-d11f0.web.app',
  corporate: process.env.EXPO_PUBLIC_CORPORATE_APP_URL || 'https://corporate-app.web.app',
  individual: process.env.EXPO_PUBLIC_INDIVIDUAL_APP_URL || 'https://individual-app.web.app',
};

const PLATFORM_WEB = 'web';

export const getRedirectUrlForRole = (role) => {
  switch (role) {
    case 'admin':
      return APP_URLS.admin;
    case 'corporate':
      return APP_URLS.corporate;
    case 'individual':
      return APP_URLS.individual;
    default:
      return null;
  }
};

/**
 * Signals the development broker to start the corresponding application.
 * This is only active during development to improve DX.
 * @param {string} role - The user's role
 */
const signalAutoStart = async (role) => {
  // Use __DEV__ check provided by React Native/Expo
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    try {
      const appName = `${role}_app`;
      // For iOS simulator, localhost is the host machine.
      // For Android emulator, you might need 10.0.2.2.
      // For simplicity and since the user is on a mac, localhost works for iOS.
      const brokerUrl = `http://localhost:8090/start?app=${appName}`;
      console.log(`[DevBroker] Signaling auto-start for: ${appName}`);
      
      // Fire and forget, don't wait for completion
      fetch(brokerUrl).catch(err => {
        console.warn('[DevBroker] Signal failed. Is scripts/dev_broker.mjs running?', err.message);
      });
    } catch (e) {
      console.warn('[DevBroker] Error in signalAutoStart:', e);
    }
  }
};

/**
 * Redirects the user to the appropriate application based on their role.
 * @param {string} role - The user's role ('admin', 'corporate', 'individual')
 */
export const redirectToApp = async (role) => {
  const url = getRedirectUrlForRole(role);
  if (!url) {
    console.warn('Unknown role for redirection:', role);
    Alert.alert('Login Successful', 'Role not recognized for automatic redirection.');
    return;
  }

  console.log('[Redirect] role:', role, 'url:', url);

  // If in development mode, signal the broker to start the target app
  await signalAutoStart(role);

  if (Platform.OS === PLATFORM_WEB) {
    window.location.href = url;
    return;
  }

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
    return;
  }

  Alert.alert('Error', `Cannot open URL: ${url}`);
};

