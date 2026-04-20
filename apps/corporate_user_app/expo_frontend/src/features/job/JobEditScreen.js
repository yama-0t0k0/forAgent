import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator, Text, Alert } from 'react-native';
import { DataContext, DataProvider } from '@shared/src/core/state/DataContext';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { JobDescriptionService } from '@shared/src/core/services/JobDescriptionService';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';

const JD_TEMPLATE = require('@assets/json/jd-template.json');
const ID_FIELD = 'id';
const COLLECTION_NAME = 'job_descriptions';

/**
 * Job Edit/Create Screen for Corporate App
 * Reuses GenericRegistrationScreen for form handling.
 * @param {Object} route - React Navigation route object (route.params: { companyId, job }).
 * @returns {JSX.Element}
 */
export const JobEditScreen = ({ route }) => {
  const navigation = useNavigation();
  const { data } = useContext(DataContext);
  const userRole = data?.currentUser?.role || 'corporate-gamma';
  const isGamma = userRole === 'corporate-gamma';

  const { companyId, job } = route.params || {};
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGamma) {
      Alert.alert('権限エラー', 'この操作を行う権限がありません。');
      navigation.navigate(ROUTES.CORPORATE_JOBS);
      return;
    }
    /**
     * @returns {Promise<void>}
     */
    const prepareData = async () => {
      if (job) {
        // Edit mode: use existing job data
        setInitialData({ ...job, company_ID: companyId });
      } else {
        // Create mode: use template and pre-fetch next JD number if possible
        // or let the service handle it on save. 
        // For GenericRegistrationScreen UI to look natural, we might want to show "New" 
        setInitialData({ ...JD_TEMPLATE, company_ID: companyId, id: '' });
      }
      setLoading(false);
    };

    prepareData();
  }, [job, companyId]);

  /**
   * @param {import('firebase/firestore').Firestore} db
   * @param {string|null} id
   * @param {Object} data
   * @returns {Promise<void>}
   */
  const handleSave = async (db, id, data) => {
    // data is the full JobDescription object including changes from the form.
    // We use JobDescriptionService to handle Firestore logic (including auto-numbering for new JDs)
    await JobDescriptionService.saveJobDescription(companyId, id || null, data);
  };

  if (loading || !initialData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background }}>
        <ActivityIndicator size='large' color={THEME.primary} />
      </View>
    );
  }

  return (
    <DataProvider initialData={initialData}>
      <GenericRegistrationScreen
        title={job ? '求人票編集' : '求人票作成'}
        idField={ID_FIELD}
        collectionName={COLLECTION_NAME}
        customSaveLogic={handleSave}
        homeRouteName={ROUTES.CORPORATE_JOBS}
      />
    </DataProvider>
  );
};
