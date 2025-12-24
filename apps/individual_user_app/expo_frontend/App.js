import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const ENGINEER_TEMPLATE = require('./assets/json/engineer-profile-template.json');

const EngineerRegistrationWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'individual', 'C000000000000'));
        if (snap.exists()) {
          const data = snap.data();
          if (mounted) setInitialData(JSON.parse(JSON.stringify(data)));
        } else {
          if (mounted) setInitialData(ENGINEER_TEMPLATE);
        }
      } catch (e) {
        if (mounted) setInitialData(ENGINEER_TEMPLATE);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading || !initialData) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <DataProvider initialData={initialData}>
      <AppNavigator />
    </DataProvider>
  );
};

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
