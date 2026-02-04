import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, Text } from 'react-native';
import { getAuth, signInAnonymously } from "firebase/auth";

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { AppShell } from '@shared/src/core/components/AppShell';

const ENGINEER_TEMPLATE = require('./assets/json/engineer-profile-template.json');

/**
 * Wrapper component for the Engineer Registration feature.
 * Manages data fetching and initialization.
 * @returns {JSX.Element} The rendered component.
 */
const EngineerRegistrationWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    /**
     * Loads the initial data for the application.
     * Fetches user data, job descriptions, and other users.
     */
    const load = async () => {
      try {
        // Sign in anonymously to allow access to secured APIs (Cloud Run)
        try {
          const auth = getAuth();
          await signInAnonymously(auth);
          console.log("Signed in anonymously");
        } catch (authError) {
          console.error("Anonymous auth failed:", authError);
        }

        // Create a timeout promise to prevent indefinite loading
        /** @type {Promise<never>} */
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Data loading timeout")), 5000)
        );

        const fetchDataPromise = FirestoreDataService.fetchIndividualAppData(
          'C000000000000',
          ENGINEER_TEMPLATE
        );

        // Race between fetch and timeout
        const result = await Promise.race([fetchDataPromise, timeoutPromise]);

        if (mounted) {
          setInitialData({
            ...result.userData,
            jd: result.jd,
            users: result.users
          });
        }
      } catch (e) {
        console.warn("Initialization error or timeout:", e);
        if (mounted) setInitialData({ ...ENGINEER_TEMPLATE, jd: [], users: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AppShell isLoading={loading || !initialData}>
      <DataProvider initialData={initialData}>
        <AppNavigator />
      </DataProvider>
    </AppShell>
  );
};

/**
 * Main application entry point.
 * Sets up the safe area provider and navigation container.
 * @returns {JSX.Element} The root component.
 */
export default function App() {
  return (
    <NavigationContainer>
      <EngineerRegistrationWrapper />
    </NavigationContainer>
  );
}
