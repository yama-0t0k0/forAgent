import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { db } from '@shared/src/core/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
// import { JDSelectionScreen } from '@shared/src/features/job/JDSelectionScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import { CompanyDetailScreen } from './src/features/company/screens/CompanyDetailScreen';
import { TechStackScreen } from '@shared/src/features/company_profile/screens/TechStackScreen';

const Stack = createNativeStackNavigator();

const AdminAppWrapper = () => {
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchDocs = async (collectionName) => {
          try {
            const snap = await getDocs(collection(db, collectionName));
            return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          } catch (e) {
            return [];
          }
        };

        const mergeById = (arrays) => {
          const map = new Map();
          arrays.flat().forEach((item) => {
            if (!item?.id) return;
            if (!map.has(item.id)) map.set(item.id, item);
          });
          return Array.from(map.values());
        };

        const [
          users,
          companiesPrimary,
          companiesFallback1,
          companiesFallback2,
          jobsPrimary,
          fmjs,
        ] = await Promise.all([
          fetchDocs('individual'),
          fetchDocs('Company'),
          fetchDocs('company'),
          fetchDocs('corporate'),
          // Fetch nested job descriptions reliably by iterating companies
          (async () => {
            try {
              // 1. Get all company IDs first
              const companiesSnap = await getDocs(collection(db, 'job_description'));
              console.log(`[DEBUG] Found ${companiesSnap.size} companies in job_description`);
              const allJobs = [];

              // 2. Fetch JD_Number subcollection for each company
              const promises = companiesSnap.docs.map(async (companyDoc) => {
                const companyId = companyDoc.id;
                try {
                  const jdSnap = await getDocs(collection(db, 'job_description', companyId, 'JD_Number'));
                  console.log(`[DEBUG] Company ${companyId}: Found ${jdSnap.size} JDs`);
                  jdSnap.forEach(doc => {
                    const data = doc.data();
                    allJobs.push({
                      id: `${companyId}_${doc.id}`,
                      company_ID: companyId,
                      JD_Number: data.JD_Number || doc.id,
                      ...data
                    });
                  });
                } catch (err) {
                  console.error(`[DEBUG] Error fetching JDs for company ${companyId}:`, err);
                }
              });

              await Promise.all(promises);
              console.log(`[DEBUG] Total jobs fetched: ${allJobs.length}`);
              return allJobs;
            } catch (e) {
              console.error("[DEBUG] Error fetching nested jobs:", e);
              return [];
            }
          })(),
          fetchDocs('FeeMgmtAndJobStatDB'),
        ]);

        const corporate = mergeById([companiesPrimary, companiesFallback1, companiesFallback2]);
        // Only use the correctly fetched job descriptions, removing dummy data sources
        const jd = jobsPrimary;

        setInitialData({
          users,
          corporate,
          jd,
          fmjs
        });
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
              name="TechStack"
              component={TechStackScreen}
              options={{ title: '使用技術詳細', headerBackTitle: '戻る' }}
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
            {/* <Stack.Screen
              name="JDSelection"
              component={JDSelectionScreen}
              options={{ title: '求人選択', headerShown: false }}
            /> */}
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
