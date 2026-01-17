import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from './src/context/DataContext';
import { GenericRegistrationScreen } from './src/screens/GenericRegistrationScreen';
import { THEME } from './src/constants/theme';
import { EngineerRegistrationWrapper } from './src/apps/EngineerApp';
import { CompanyRegistrationWrapper } from './src/apps/CompanyApp';

export default function App() {
  const appMode = process.env.EXPO_PUBLIC_APP_MODE; // 'engineer' | 'company'

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          {appMode === 'engineer' ? (
            <EngineerRegistrationWrapper />
          ) : (
            <CompanyRegistrationWrapper />
          )}
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Styles can be added here if needed
});
