import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import { CompanyDetailScreen } from './src/features/company/screens/CompanyDetailScreen';


const Stack = createNativeStackNavigator();

/**
 * Main application wrapper component.
 * Manages initial data fetching and global state.
 * @returns {JSX.Element} The root component.
 */
const AdminAppWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches all required data for the application using FirestoreDataService.
     */
    const fetchAllData = async () => {
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={THEME.accent || '#000'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DataProvider initialData={initialData}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Dashboard">
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CompanyDetail"
              component={CompanyDetailScreen}
              options={{ title: '会社詳細', headerBackTitle: '戻る' }}
            />
            <Stack.Screen
              name="MyPage"
              component={IndividualProfileScreen}
              options={{ title: '個人マイページ', headerShown: false }}
            />
            <Stack.Screen
              name="Menu"
              component={IndividualMenuScreen}
              options={{ title: 'メニュー', headerShown: false }}
            />
            <Stack.Screen
              name="ImageEdit"
              component={IndividualImageEditScreen}
              options={{ title: '画像編集', headerShown: false }}
            />
            <Stack.Screen
              name="Connection"
              component={ConnectionScreen}
              options={{ title: 'つながり', headerShown: false }}
            />
            <Stack.Screen
              name="Career"
              component={CareerScreen}
              options={{ title: 'キャリア', headerShown: false }}
            />
            <Stack.Screen
              name="JobDescription"
              component={JobDescriptionScreen}
              options={{ title: '求人詳細', headerShown: false }}
            />
            <Stack.Screen name="Registration">
              {(props) => (
                <GenericRegistrationScreen
                  {...props}
                  title="エンジニア個人詳細編集"
                  collectionName="individual"
                  idField="id_individual"
                  idPrefixChar="C"
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar barStyle="dark-content" />
      </DataProvider>
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
