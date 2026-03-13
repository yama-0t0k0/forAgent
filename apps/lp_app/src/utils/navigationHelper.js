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
