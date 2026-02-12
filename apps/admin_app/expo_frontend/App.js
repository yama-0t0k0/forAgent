import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
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
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
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

  // Auto-Grant Admin Privileges in Dev Mode & Fetch Data
  useEffect(() => {
    // Immediate sign-in check for development
    if (__DEV__ && !auth.currentUser) {
       console.log('⚠️ [Dev Mode] No current user found initially. Attempting Anonymous Sign-In...');
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
      
      if (user) {
        try {
          // 1. Check & Grant Admin Role
          if (__DEV__) {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.role !== 'admin') {
                console.log('🔧 [Dev Mode] Auto-granting Admin privileges...');
                await setDoc(userDocRef, { 
                  role: 'admin',
                  dev_admin_grant: 'allow_local_dev',
                  updatedAt: new Date().toISOString() 
                }, { merge: true });
                console.log('✅ [Dev Mode] Admin privileges granted.');
                
                // Force token refresh to pick up new claims immediately
                await user.getIdToken(true);
              }

              // Auto-Migration: FeeMgmtAndJobStatDB -> selection_progress
              try {
                const selColRef = collection(db, 'selection_progress');
                const selSnap = await getDocs(selColRef);
                
                if (selSnap.empty) {
                  console.log('📦 [Dev Mode] selection_progress is empty. Migrating from FeeMgmtAndJobStatDB...');
                  DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[MIGRATE]|START|From FeeMgmtAndJobStatDB`);
                  
                  const sourceSnap = await getDocs(collection(db, 'FeeMgmtAndJobStatDB'));
                  
                  if (!sourceSnap.empty) {
                    const migrationPromises = sourceSnap.docs.map(docSnap => 
                      setDoc(doc(db, 'selection_progress', docSnap.id), docSnap.data())
                    );
                    await Promise.all(migrationPromises);
                    const msg = `✅ [Dev Mode] Migrated ${sourceSnap.size} documents.`;
                    console.log(msg);
                    DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[MIGRATE]|SUCCESS|${sourceSnap.size} docs`);
                  } else {
                    const msg = '⚠️ [Dev Mode] FeeMgmtAndJobStatDB is also empty.';
                    console.log(msg);
                    DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[MIGRATE]|EMPTY|Source is empty`);
                  }
                }
              } catch (migErr) {
                console.error('❌ [Dev Mode] Migration failed:', migErr);
                DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[MIGRATE]|ERROR|${migErr.message}`);
              }
            }
          }

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
        console.log('⚠️ User not signed in. Attempting fetch anyway (Rule Relaxed Mode)...');
        if (__DEV__) {
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', `[AUTH]|NOT_SIGNED_IN|Fallback Fetching...`);
        }
        // Fallback: Fetch data even if not signed in (assuming rules are relaxed)
        await fetchAllData();
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
          <Stack.Navigator initialRouteName={ROUTES.ADMIN_DASHBOARD}>
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
              component={IndividualMenuScreen}
              options={{ title: 'メニュー', headerShown: false }}
            />
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
    backgroundColor: '#F5F7FA',
  },
});
