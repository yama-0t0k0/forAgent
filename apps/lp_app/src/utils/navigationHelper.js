import { Platform, Linking, Alert } from 'react-native';

// TODO: Update these URLs with actual production/development URLs
const APP_URLS = {
  admin: 'https://admin-app-site-d11f0.web.app', // Based on firebase.json
  corporate: process.env.EXPO_PUBLIC_CORPORATE_APP_URL || 'http://localhost:8082', // Placeholder
  individual: process.env.EXPO_PUBLIC_INDIVIDUAL_APP_URL || 'http://localhost:8081', // Placeholder
};

const PLATFORM_WEB = 'web';

/**
 * Redirects the user to the appropriate application based on their role.
 * @param {string} role - The user's role ('admin', 'corporate', 'individual')
 */
export const redirectToApp = async (role) => {
  let url = null;

  switch (role) {
    case 'admin':
      url = APP_URLS.admin;
      break;
    case 'corporate':
      url = APP_URLS.corporate;
      break;
    case 'individual':
      url = APP_URLS.individual;
      break;
    default:
      console.warn('Unknown role for redirection:', role);
      Alert.alert('Login Successful', 'Role not recognized for automatic redirection.');
      return;
  }

  if (url) {
    if (Platform.OS === PLATFORM_WEB) {
      window.location.href = url;
    } else {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    }
  }
};
