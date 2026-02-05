import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@shared/src/core/firebaseConfig';
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


const Stack = createNativeStackNavigator();

/**
 * Main application wrapper component.
 * Manages initial data fetching and global state.
 * @returns {JSX.Element} The root component.
 */
const AdminAppWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Custom save logic for Admin App to handle split data (public_profile + private_info).
   */
  const handleAdminUserSave = async (db, id, data) => {
    // 1. Split data
    const { publicData, privateData } = User.splitData(data);
    // 2. Save public profile
    await setDoc(doc(db, 'public_profile', id), publicData);
    // 3. Save private info (Admin has permission)
    // Use merge: true to preserve fields not present in form data (e.g. allowed_companies if missing)
    await setDoc(doc(db, 'private_info', id), privateData, { merge: true });
  };

  useEffect(() => {
    /**
     * Fetches all required data for the application using FirestoreDataService.
     */
    const fetchAllData = async () => {
      // E2E Bypass
      if (E2E_CONFIG.USE_MOCK_DATA) {
        console.log('⚠️ Using MOCK DATA for E2E Testing');

        // Convert raw mock data to Model instances to match FirestoreDataService behavior
        const mockUsers = MOCK_ADMIN_DATA.users.map(u => User.fromFirestore(u.id, u.rawData));
        const mockCorporate = MOCK_ADMIN_DATA.corporate.map(c => Company.fromFirestore(c.id, c.rawData));
        const mockJd = MOCK_ADMIN_DATA.jd.map(j => JobDescription.fromFirestore(j.id, j.rawData));
        // SelectionProgress might need mapping too if added later, currently unused/empty in mock

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
      } catch (e) {
        console.error('Failed to fetch admin data:', e);
        // Fallback to empty structure to allow UI to render even if fetch fails
        setInitialData({ users: [], corporate: [], jd: [], fmjs: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
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
  );
};

export default AdminAppWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});
