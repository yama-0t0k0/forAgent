import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { CompanyPageScreen } from '@shared/src/features/company_profile/screens/CompanyPageScreen';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const CompanyDetailScreen = () => {
  const route = useRoute();
  const { companyId, initialData } = route.params || {};
  const [companyData, setCompanyData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        // Try to fetch from 'company' collection (used by corporate_user_app)
        let docRef = doc(db, 'company', companyId);
        let snap = await getDoc(docRef);

        if (!snap.exists()) {
          // Fallback to 'Company' or 'corporate' if needed
          // admin_app seems to fetch from 'Company' and 'corporate' as well
          docRef = doc(db, 'corporate', companyId);
          snap = await getDoc(docRef);
          
          if (!snap.exists()) {
             docRef = doc(db, 'Company', companyId);
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
  const formattedData = useMemo(() => {
    if (!companyData) return {};

    // Check if data is already nested (has '会社概要')
    if (companyData['会社概要']) {
      return companyData;
    }

    // Determine company name using same logic as list view
    const companyName = companyData.companyName || companyData.name || '名称未設定';

    // Map flat data to nested structure
    return {
      '会社概要': {
        '社名': companyName,
        '事業内容': companyData.businessContent || companyData.description || '事業内容が設定されていません。',
        '住所': companyData.address || '',
        '背景画像URL': companyData.backgroundUrl || companyData.backgroundImage,
        'ロゴ画像URL': companyData.logoUrl || companyData.logo,
        '設立': companyData.establishmentDate,
        '従業員数': companyData.employeeCount,
        '本社所在地': companyData.address,
        'URL': companyData.website,
      },
      '魅力/特徴': companyData.features || companyData['魅力/特徴'] || {},
      '使用技術': companyData.tech_stack || {},
      // Preserve other top-level fields
      ...companyData
    };
  }, [companyData]);

  if (loading && !companyData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
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
    <DataProvider initialData={formattedData}>
      <CompanyPageScreen />
    </DataProvider>
  );
};
