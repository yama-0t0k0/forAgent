import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@shared/src/core/theme/theme';
import SelectionProgressListScreen from './src/screens/SelectionProgressListScreen';
import { AppShell } from '@shared/src/core/components/AppShell';
import { ROUTES } from '@shared/src/core/constants/navigation';

export default function App() {
  return (
    <AppShell>
      <SelectionProgressListScreen />
    </AppShell>
  );
}
