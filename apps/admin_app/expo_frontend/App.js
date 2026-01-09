import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { db } from '@shared/src/core/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import DashboardScreen from './src/features/dashboard/DashboardScreen';

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
          jobsFallback1,
          jobsFallback2,
          fmjs,
        ] = await Promise.all([
          fetchDocs('individual'),
          fetchDocs('Company'),
          fetchDocs('company'),
          fetchDocs('corporate'),
          fetchDocs('job_description'),
          fetchDocs('jobs'),
          fetchDocs('jd'),
          fetchDocs('FeeMgmtAndJobStatDB'),
        ]);

        const corporate = mergeById([companiesPrimary, companiesFallback1, companiesFallback2]);
        const jd = mergeById([jobsPrimary, jobsFallback1, jobsFallback2]);

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
    <DataProvider initialData={initialData}>
      <DashboardScreen />
    </DataProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <AdminAppWrapper />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});
