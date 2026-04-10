import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { useRoute } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { CompanyPageScreen } from '@corporate_app/src/features/company_profile/CompanyPageScreen';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { formatCompanyData } from '../utils/companyDataFormatter';

/**
 * Screen component for displaying detailed company information.
 * Fetches company data from Firestore and formats it for display.
 * @returns {JSX.Element} The rendered screen.
 */
export const CompanyDetailScreen = () => {
  const route = useRoute();
  const { companyId, initialData } = route.params || {};
  const [companyData, setCompanyData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialData) {
      setCompanyData(initialData);
    }
  }, [companyId, initialData]);

  useEffect(() => {
    /**
     * Fetches company data from Firestore.
     * Tries multiple collections ('Company', 'company', 'corporate') to find the document.
     * @returns {Promise<void>}
     */
    const fetchCompanyData = async () => {
      // If we already have nested data passed in (unlikely but possible), use it?
      // Actually, let's always fetch to be safe and consistent with "Individual" tab pattern
      // unless initialData is already fully populated.
      // But for now, let's prioritize fetching by ID if available.

      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from 'Company' collection first (matching App.js priority)
        let docRef = doc(db, 'Company', companyId);
        let snap = await getDoc(docRef);

        if (!snap.exists()) {
          // Fallback to 'company'
          docRef = doc(db, 'company', companyId);
          snap = await getDoc(docRef);

          if (!snap.exists()) {
            // Fallback to 'corporate'
            docRef = doc(db, 'corporate', companyId);
            snap = await getDoc(docRef);
          }
        }

        if (snap.exists()) {
          setCompanyData({ id: snap.id, ...snap.data() });
        } else {
          console.log('Company document not found in any collection');
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  // Map flat admin data to structure expected by CompanyPageScreen
  // This is a fallback if the fetched data is flat
  /**
   * Formats raw company data into the structure required by the UI.
   * @type {Object}
   */
  const formattedData = useMemo(() => {
    return formatCompanyData(companyData);
  }, [companyData]);

  if (loading && !companyData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color={THEME.primary} />
      </View>
    );
  }

  if (!companyData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading or No Data...</Text>
        <Text>ID: {companyId}</Text>
      </View>
    );
  }

  return (
    <DataProvider key={companyId} initialData={formattedData}>
      <CompanyPageScreen />
    </DataProvider>
  );
};
