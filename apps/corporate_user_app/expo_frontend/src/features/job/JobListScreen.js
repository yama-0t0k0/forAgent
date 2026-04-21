import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { JobDescriptionService } from '@shared/src/core/services/JobDescriptionService';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { CorporateJobCard } from './components/CorporateJobCard';
import { AppShell } from '@shared/src/core/components/AppShell';
import { DataContext } from '@shared/src/core/state/DataContext';

/**
 * Job List Screen for Corporate App
 */
export const JobListScreen = () => {
  const navigation = useNavigation();
  const { data } = useContext(DataContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const JOB_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };
  const IONICON_NAME = {
    ADD: 'add',
    EMPTY: 'document-text-outline',
  };

  // Extract companyId and role from DataContext
  const companyId = data?.id || 'B00000'; 
  const userRole = data?.currentUser?.role || 'corporate-gamma';
  const isGamma = userRole === 'corporate-gamma';

  const fetchJobs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const jobList = await JobDescriptionService.listCompanyJobDescriptions(companyId);
      // Sort by status (active first) then by ID descending
      const sortedJobs = jobList.sort((a, b) => {
        if (a.status === b.status) return b.id.localeCompare(a.id);
        return a.status === JOB_STATUS.ACTIVE ? -1 : 1;
      });
      setJobs(sortedJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      Alert.alert('エラー', '求人一覧の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  /**
   * @returns {void}
   */
  const handleCreateNew = () => {
    navigation.navigate(ROUTES.CORPORATE_JOB_EDIT, { companyId });
  };

  /**
   * @param {Object} job
   * @returns {void}
   */
  const handleEdit = (job) => {
    navigation.navigate(ROUTES.CORPORATE_JOB_EDIT, { companyId, job });
  };

  /**
   * @param {string} jobId
   * @returns {void}
   */
  const handleDeleteSuccess = (jobId) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  /**
   * @param {string} jobId
   * @param {string} newStatus
   * @returns {void}
   */
  const handleStatusChange = (jobId, newStatus) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  /**
   * @returns {JSX.Element}
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>求人管理</Text>
      {!isGamma && (
        <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
          <Ionicons name={IONICON_NAME.ADD} size={24} color={THEME.textInverse} />
          <Text style={styles.addButtonText}>新規作成</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <AppShell isLoading={true}>
        <View />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.container}>
        {renderHeader()}
        
        <GenericDataList
          data={jobs}
          renderItem={({ item }) => (
            <CorporateJobCard
              job={item}
              onEdit={() => handleEdit(item)}
              onDeleteSuccess={handleDeleteSuccess}
              onStatusChange={handleStatusChange}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchJobs(false);
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name={IONICON_NAME.EMPTY} size={64} color={THEME.textMuted} />
              <Text style={styles.emptyTitle}>求人票がありません</Text>
              <Text style={styles.emptySub}>新しい求人票を作成して、採用候補者を探しましょう。</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                <Text style={styles.emptyButtonText}>求人票を作成する</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    ...THEME.shadow.sm,
  },
  addButtonText: {
    color: THEME.textInverse,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: THEME.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  emptyButtonText: {
    color: THEME.primary,
    fontWeight: 'bold',
  }
});
