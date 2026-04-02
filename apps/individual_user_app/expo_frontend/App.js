import React, { useEffect } from 'react';
import { StatusBar, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LaunchController } from './src/apps/LaunchController';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * App.js (Entry Point)
 * Simplified entry point that delegates app selection to the LaunchController.
 */
export default function App() {
  // Deep Link Listener: Handle incoming deep links from LP app
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log(`[DeepLink][individual_user_app] Received: ${url}`);
      // TODO: Parse URL path/query for screen-specific navigation
    };

    // Cold Start: App was launched via a deep link URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log(`[DeepLink][individual_user_app] Initial URL: ${url}`);
        handleDeepLink({ url });
      }
    }).catch((err) => {
      console.warn('[DeepLink][individual_user_app] getInitialURL error:', err);
    });

    // Warm Start: URL received while app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <NavigationContainer>
        <LaunchController />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
