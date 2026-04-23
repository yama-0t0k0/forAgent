import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db, auth } from '@shared/src/core/firebaseConfig';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { User } from '@shared/src/core/models/User';
import { Company } from '@shared/src/core/models/Company';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { SignInScreen } from '@shared/src/features/auth/screens/SignInScreen';
import { authService } from '@shared/src/features/auth/services/authService';
import { AppMenuScreen } from '@shared/src/features/profile/AppMenuScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import { CompanyDetailScreen } from './src/features/company/screens/CompanyDetailScreen';
import { AppShell } from '@shared/src/core/components/AppShell';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { E2E_CONFIG, MOCK_ADMIN_DATA } from './src/core/constants';
import { TestLogOverlay } from '@shared/src/core/components/TestLogOverlay';
import { logFirestoreIO } from '@shared/src/core/utils/FirestoreLogger';


const Stack = createNativeStackNavigator();

/**
 * Main application wrapper component.
 * Manages initial data fetching and global state.
 * @returns {JSX.Element} The root component.
 */
const AdminAppWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Deep Link Listener: Handle incoming deep links from LP app
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log(`[DeepLink][admin_app] Received: ${url}`);
      // TODO: Parse URL path/query for screen-specific navigation
    };

    // Cold Start: App was launched via a deep link URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log(`[DeepLink][admin_app] Initial URL: ${url}`);
        handleDeepLink({ url });
      }
    }).catch((err) => {
      console.warn('[DeepLink][admin_app] getInitialURL error:', err);
    });

    // Warm Start: URL received while app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Auto-Grant Admin Privileges in Dev Mode & Fetch Data
  useEffect(() => {
    // Immediate sign-in check for development
    // E2Eテスト時は認証をスキップしてダッシュボードを表示できるようにする
    const skipAuth = process.env.EXPO_PUBLIC_E2E_SKIP_AUTH === 'true';
    if (skipAuth && __DEV__ && !auth.currentUser) {
      console.log('⚠️ [E2E Mode] Skipping Auth. Attempting Anonymous Sign-In...');
      const { DeviceEventEmitter } = require('react-native');
      setTimeout(() => {
        DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[INIT]|AUTH_MISSING|Attempting Anon Login...`);
      }, 500);

      // Force Anonymous Login to bypass lack of persistence
      signInAnonymously(auth).catch((e) => {
        console.error('❌ [Dev Mode] Anonymous Sign-In Failed:', e);
        DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[AUTH]|ANON_FAIL|${e.message}`);
      });
    }

    // Failsafe Timeout: If auth doesn't resolve in 5 seconds, stop loading so logs can be seen
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('❌ [Auth Timeout] onAuthStateChanged did not fire within 5 seconds. Fetching data as fallback...');
        if (__DEV__) {
          const { DeviceEventEmitter } = require('react-native');
          DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[AUTH]|TIMEOUT|Fallback Fetching...`);
        }
        // Fallback: Fetch data even if auth fails (assuming rules are relaxed)
        fetchAllData();
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId); // Clear timeout on response
      console.log('🔐 [Auth State Changed] User:', user ? user.uid : 'null');
      setUser(user);

      if (user) {
        try {
          // Admin check and migration logic removed for production-ready dev environment.
          // Admin roles must be assigned via Custom Claims (setCustomUserClaims).

          // 2. Fetch Data (Only after Auth is confirmed)
          console.log('🔄 Authenticated. Fetching all data...');

          // Emit log to TestLogOverlay explicitly since it listens to DeviceEventEmitter
          // This ensures the user sees "Authenticated" in the overlay
          if (__DEV__) {
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[AUTH]|SIGNED_IN|${user.uid}`);
          }

          await fetchAllData();

        } catch (e) {
          console.error('❌ [App.js] Auth/Admin logic failed:', e);
          setLoading(false);
        }
      } else {
        console.log('⚠️ User not signed in.');
        if (__DEV__) {
          const { DeviceEventEmitter } = require('react-native');
          DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[AUTH]|NOT_SIGNED_IN|Waiting for Login...`);
        }
        // Do NOT fetch data if not signed in, just stop loading to show SignInScreen
        setInitialData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Fetches all required data for the application using FirestoreDataService.
   */
  const fetchAllData = async () => {
    // E2E Bypass
    if (E2E_CONFIG.USE_MOCK_DATA) {
      console.log('⚠️ Using MOCK DATA for E2E Testing');
      const mockUsers = MOCK_ADMIN_DATA.users.map(u => User.fromFirestore(u.id, u.rawData));
      const mockCorporate = MOCK_ADMIN_DATA.corporate.map(c => Company.fromFirestore(c.id, c.rawData));
      const mockJd = MOCK_ADMIN_DATA.jd.map(j => JobDescription.fromFirestore(j.id, j.rawData));

      setInitialData({
        users: mockUsers,
        corporate: mockCorporate,
        jd: mockJd,
        fmjs: MOCK_ADMIN_DATA.fmjs
      });
      setLoading(false);
      return;
    }

    try {
      const data = await FirestoreDataService.fetchAdminData();
      setInitialData(data);
      console.log('✅ Data fetched successfully.');
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
      setInitialData({ users: [], corporate: [], jd: [], fmjs: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <TestLogOverlay />
      <AppShell isLoading={loading}>
        <DataProvider initialData={initialData}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName={user ? ROUTES.ADMIN_DASHBOARD : ROUTES.ADMIN_LOGIN}>
              {user ? (
                // Authenticated Stack
                <>
                  <Stack.Screen
                    name={ROUTES.ADMIN_DASHBOARD}
                    component={DashboardScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name={ROUTES.ADMIN_COMPANY_DETAIL}
                    component={CompanyDetailScreen}
                    options={{ title: '会社詳細', headerBackTitle: '戻る' }}
                  />
                  <Stack.Screen
                    name={ROUTES.INDIVIDUAL_MY_PAGE}
                    component={IndividualProfileScreen}
                    options={{ title: '個人マイページ', headerShown: false }}
                  />
                  <Stack.Screen
                    name={ROUTES.MENU}
                    options={{ title: 'メニュー', headerShown: false }}
                  >
                    {(props) => <AppMenuScreen {...props} role="admin" />}
                  </Stack.Screen>
                  <Stack.Screen
                    name={ROUTES.IMAGE_EDIT}
                    component={IndividualImageEditScreen}
                    options={{ title: '画像編集', headerShown: false }}
                  />
                  <Stack.Screen
                    name={ROUTES.INDIVIDUAL_CONNECTION}
                    component={ConnectionScreen}
                    options={{ title: 'つながり', headerShown: false }}
                  />
                  <Stack.Screen
                    name={ROUTES.INDIVIDUAL_CAREER}
                    component={CareerScreen}
                    options={{ title: 'キャリア', headerShown: false }}
                  />
                  <Stack.Screen
                    name={ROUTES.JOB_DESCRIPTION}
                    component={JobDescriptionScreen}
                    options={{ title: '求人詳細', headerShown: false }}
                  />
                  <Stack.Screen name={ROUTES.REGISTRATION}>
                    {(props) => (
                      <GenericRegistrationScreen
                        {...props}
                        title="エンジニア個人詳細編集"
                        collectionName="public_profile"
                        idField="id_individual"
                        idPrefixChar="C"
                        customSaveLogic={handleAdminUserSave}
                      />
                    )}
                  </Stack.Screen>
                </>
              ) : (
                // Unauthenticated Stack
                <Stack.Screen
                  name={ROUTES.ADMIN_LOGIN}
                  component={SignInScreen}
                  options={{ headerShown: false }}
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </DataProvider>
      </AppShell>
    </SafeAreaProvider>
  );
};

export default AdminAppWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
});
