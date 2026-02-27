import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { LaunchController } from './src/apps/LaunchController';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * App.js (Entry Point)
 * Simplified entry point that delegates app selection to the LaunchController.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <NavigationContainer>
        <LaunchController />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
