import React from 'react';
import { StatusBar } from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

const ENGINEER_TEMPLATE = require('./assets/json/engineer-profile-template.json');

const EngineerRegistrationWrapper = () => (
  <DataProvider initialData={ENGINEER_TEMPLATE}>
    <AppNavigator />
  </DataProvider>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <EngineerRegistrationWrapper />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
