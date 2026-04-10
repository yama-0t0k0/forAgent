import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './src/navigation/AppNavigation';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  console.log('🚀 [App] LP App component mounting...');
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigation />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
