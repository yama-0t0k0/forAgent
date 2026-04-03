import { Platform, Linking, Alert } from 'react-native';

/**
 * Dev/Prod URL auto-switching for role-based app redirection.
 *
 * Development: Uses HTTP localhost URLs matching start_expo.sh port mappings.
 *   - admin_app:           Port 8081
 *   - individual_user_app: Port 8082
 *   - corporate_user_app:  Port 8083
 *   Override via EXPO_PUBLIC_*_APP_URL in .env if needed.
 *
 * Production: Uses Custom URL Schemes for native app-to-app navigation.
 *   - admin-app://home
 *   - individual-app://home
 *   - corporate-app://home
 */
const PLATFORM_WEB = 'web';

const APP_URLS = __DEV__
  ? {
      admin: process.env.EXPO_PUBLIC_ADMIN_APP_URL || 'http://localhost:8081',
      individual: process.env.EXPO_PUBLIC_INDIVIDUAL_APP_URL || 'http://localhost:8082',
      corporate: process.env.EXPO_PUBLIC_CORPORATE_APP_URL || 'http://localhost:8083',
    }
  : Platform.OS === PLATFORM_WEB
  ? {
      admin: process.env.EXPO_PUBLIC_PROD_WEB_ADMIN_URL || 'https://admin.lat-inc.com',
      individual: process.env.EXPO_PUBLIC_PROD_WEB_INDIVIDUAL_URL || 'https://individual.lat-inc.com',
      corporate: process.env.EXPO_PUBLIC_PROD_WEB_CORPORATE_URL || 'https://corporate.lat-inc.com',
    }
  : {
      admin: 'admin-app://home',
      individual: 'individual-app://home',
      corporate: 'corporate-app://home',
    };

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
 * Polls a port until it becomes active or times out.
 * @param {number} port - The port to check
 * @param {number} timeoutMs - Max wait time
 */
const waitForPort = async (port, timeoutMs = 20000) => {
  const start = Date.now();
  console.log(`[Redirect] Waiting for port ${port}...`);
  
  while (Date.now() - start < timeoutMs) {
    try {
      // Use a simple fetch to see if the port is reachable
      // timeout: 500ms for each attempt
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 500);
      
      const response = await fetch(`http://localhost:${port}/`, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      clearTimeout(id);
      
      if (response.ok || response.status < 500) {
        console.log(`[Redirect] Port ${port} is active!`);
        return true;
      }
    } catch (e) {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.warn(`[Redirect] Timeout waiting for port ${port}`);
  return false;
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
  if (__DEV__) {
    await signalAutoStart(role);
    
    // Extract port from URL if it's a localhost URL
    const portMatch = url.match(/:(\d+)/);
    if (portMatch) {
      const port = parseInt(portMatch[1], 10);
      // Wait for the app to actually start before redirecting
      // This prevents the "Could not connect to server" error in the simulator browser
      const ready = await waitForPort(port);
      if (!ready) {
        Alert.alert(
          'Startup Timeout',
          `The ${role} app is taking longer than expected to start on port ${port}. Please check the console logs.`,
          [{ text: 'Try Anyway', onPress: () => performRedirect(url) }, { text: 'Cancel', style: 'cancel' }]
        );
        return;
      }
    }
  }

  await performRedirect(url);
};

/**
 * Internal helper to handle the actual platform-specific redirection
 * @param {string} url 
 */
const performRedirect = async (url) => {
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

