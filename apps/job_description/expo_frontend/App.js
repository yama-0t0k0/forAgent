import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppShell } from '@shared/src/core/components/AppShell';

// Load initial data from jd.json
const JD_DATA = require('./assets/json/jd.json');

/**
 * Main application component.
 * Initializes the app with DataProvider and Navigation.
 * @returns {JSX.Element} The rendered app.
 */
export default function App() {
  return (
    <AppShell>
      <DataProvider initialData={JD_DATA}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </DataProvider>
    </AppShell>
  );
}
