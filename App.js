import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataProvider } from './src/context/DataContext';
import { MainScreen } from './src/screens/MainScreen';
import { THEME } from './src/constants/theme';

export default function App() {
  return (
    <DataProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
          <StatusBar barStyle="dark-content" />
          <MainScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    </DataProvider>
  );
}
