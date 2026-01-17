import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from './src/context/DataContext';
import { GenericRegistrationScreen } from './src/screens/GenericRegistrationScreen';
import { THEME } from './src/constants/theme';
import { EngineerRegistrationWrapper } from './src/apps/EngineerApp';
import { CompanyRegistrationWrapper } from './src/apps/CompanyApp';

import { APP_MODE } from './src/apps/mode_config';

export default function App() {
  const appMode = APP_MODE;
  console.log('App Mode:', appMode);

  let Screen;
  if (appMode === 'engineer') {
    Screen = EngineerRegistrationWrapper;
  } else {
    // Default to Company for any other value or undefined
    Screen = CompanyRegistrationWrapper;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Screen />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Styles can be added here if needed
});
