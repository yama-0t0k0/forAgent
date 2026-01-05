import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@shared/src/core/theme/theme';
import SelectionProgressListScreen from './src/screens/SelectionProgressListScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <SelectionProgressListScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
