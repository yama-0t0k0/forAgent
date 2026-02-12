import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';

// Models
import { User } from '@shared/src/core/models/User';
import { Company } from '@shared/src/core/models/Company';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { SelectionProgress } from '@shared/src/core/models/SelectionProgress';

// Styles
import { styles } from './dashboardStyles';

// Utils
import { extractSkills, getHighDensityHeatmapData, getCompanyName } from '@shared/src/core/utils/dashboardUtils';

// Components
import { DashboardIcon, NotificationIcon } from './components/common/DashboardHelpers';
import { BottomNavItem } from '@shared/src/core/components/BottomNavItem';
import { ScreenHeader } from '@shared/src/core/components/ScreenHeader';
import { OverviewTab } from './components/tabs/OverviewTab';
import { IndividualTab } from './components/tabs/IndividualTab';
import { CompanyTab } from './components/tabs/CompanyTab';
import { JobTab } from './components/tabs/JobTab';
import { SelectionTab } from './components/tabs/SelectionTab';
import { DrillDownModal } from './components/modals/DrillDownModal';
import { UserDetailModal } from './components/modals/UserDetailModal';
import { JobDetailModal } from './components/modals/JobDetailModal';
import { DASHBOARD_TABS, E2E_CONFIG } from '@core/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---------------------------
// Constants & Config
// ---------------------------
const TABS = [
  { id: DASHBOARD_TABS.DASHBOARD, label: 'ホーム', icon: true },
  { id: DASHBOARD_TABS.INDIVIDUAL, label: '個人' },
  { id: DASHBOARD_TABS.COMPANY, label: '法人' },
  { id: DASHBOARD_TABS.JOB, label: '求人' },
  { id: DASHBOARD_TABS.SELECTION, label: '選考' },
];

// ---------------------------
// Main Component
// ---------------------------
/**
 * Main dashboard screen component managing tabs and data display.
 * @returns {JSX.Element} The rendered dashboard screen.
 */
export default function DashboardScreen() {
  const navigation = useNavigation();
  const { data } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState(DASHBOARD_TABS.DASHBOARD);

  // Search States
  const [searchQueries, setSearchQueries] = useState({
    [DASHBOARD_TABS.INDIVIDUAL]: '',
    [DASHBOARD_TABS.COMPANY]: '',
    [DASHBOARD_TABS.JOB]: '',
    [DASHBOARD_TABS.SELECTION]: ''
  });

  // Drill-down Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFilter, setModalFilter] = useState(null); // e.g., { type: 'status', value: 'entry' }
  const [modalTitle, setModalTitle] = useState('');

  // User Detail Modal State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserDoc, setSelectedUserDoc] = useState(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState(null);
  const [selectedUserCache, setSelectedUserCache] = useState({});

  // Job Detail Modal State
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobDoc, setSelectedJobDoc] = useState(null);

  /**
   * Updates the search query for a specific tab.
   * @param {string} tab - The tab identifier.
   * @param {string} text - The search text.
   */
  const updateSearch = (tab, text) => {
    setSearchQueries(prev => ({ ...prev, [tab]: text }));
  };

  /**
   * Closes the user detail modal and resets state.
   */
  const closeUserDetail = () => {
    setSelectedUserId(null);
    setSelectedUserDoc(null);
    setSelectedUserLoading(false);
    setSelectedUserError(null);
  };

  /**
   * Closes the job detail modal and resets state.
   */
  const closeJobDetail = () => {
    setSelectedJobId(null);
    setSelectedJobDoc(null);
  };

  useEffect(() => {
    /**
     * Fetches user data asynchronously.
     */
    const run = async () => {
      if (!selectedUserId) return;

      const cached = selectedUserCache[selectedUserId];
      if (cached) {
        setSelectedUserDoc(cached);
        setSelectedUserLoading(false);
        setSelectedUserError(null);
        return;
      }

      setSelectedUserLoading(true);
      setSelectedUserError(null);
      setSelectedUserDoc(null);

      try {
        // E2E Test Fallback
        if (selectedUserId === E2E_CONFIG.DUMMY_USER_ID) {
          try {
            const template = require('@assets/json/engineer-profile-template.json');
            // Wrap in User model for consistency
            setSelectedUserDoc(User.fromFirestore(selectedUserId, template));
            setSelectedUserLoading(false);
            return;
          } catch (e) {
            console.log('Template not found, using minimal mock');
            const mock = {
              id: E2E_CONFIG.DUMMY_USER_ID,
              '基本情報': { '姓': '開発者', '名': '【テスト】', 'メール': 'test@example.com' }
            };
            // Wrap in User model for consistency
            setSelectedUserDoc(User.fromFirestore(selectedUserId, mock));
            setSelectedUserLoading(false);
            return;
          }
        }

        const userModel = await FirestoreDataService.fetchIndividualById(selectedUserId);
        
        if (!userModel) {
          setSelectedUserError(`ユーザー（ID: ${selectedUserId}）が見つかりませんでした`);
          setSelectedUserLoading(false);
          return;
        }

        setSelectedUserDoc(userModel);
        setSelectedUserCache(prev => ({ ...prev, [selectedUserId]: userModel }));
        setSelectedUserLoading(false);
      } catch (e) {
        console.error(e);
        setSelectedUserError('個人データの取得に失敗しました');
        setSelectedUserLoading(false);
      }
    };

    run();
  }, [selectedUserId, selectedUserCache]);

  // ---------------------------
  // Data Aggregation & Filtering
  // ---------------------------

  // Individual Tab Data
  /**
   * Filters user list based on search query.
   * @type {Array<User>}
   */
  const filteredUsers = useMemo(() => {
    const query = searchQueries[DASHBOARD_TABS.INDIVIDUAL].toLowerCase();
    const users = [...(data?.users || [])];

    // Inject E2E Dummy User if empty - REMOVED per user request
    // if (users.length === 0) { ... }

    return users.filter(u => {
      // Use rawData for nested fields not fully mapped in User model yet
      const basicInfo = u.rawData['基本情報'] || {};
      const address = basicInfo['住所'] || {};
      const education = basicInfo['学歴詳細'] || {};

      const searchableText = [
        u.id,
        u.firstNameKanji,
        u.familyNameKanji,
        u.email,
        // Fallback checks for raw data
        u.rawData.name,
        basicInfo['姓'],
        basicInfo['名'],
        basicInfo['メールアドレス'],
        address['都道府県or州など'],
        education['学校名']
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(query);
    }).sort((a, b) => (b.rawData.createdAt || 0) - (a.rawData.createdAt || 0)); // Newest first
  }, [data?.users, searchQueries.individual]);

  // Company Tab Data
  /**
   * Filters company list based on search query.
   * @type {Array<Company>}
   */
  const filteredCompanies = useMemo(() => {
    const query = searchQueries[DASHBOARD_TABS.COMPANY].toLowerCase();
    const rawCompanies = [...(data?.corporate || [])];

    if (rawCompanies.length === 0) {
      // E2E Dummy Data Injection Removed
    }

    const companies = rawCompanies.map(c => Company.fromFirestore(c.id, c));

    return companies.filter(c =>
      (c.id && c.id.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.rawData.companyName && c.rawData.companyName.toLowerCase().includes(query))
    ).sort((a, b) => (b.rawData.createdAt || 0) - (a.rawData.createdAt || 0));
  }, [data?.corporate, searchQueries[DASHBOARD_TABS.COMPANY]]);

  // Job Tab Data
  /**
   * Filters job list based on search query.
   * @type {Array<JobDescription>}
   */
  const filteredJobs = useMemo(() => {
    const query = searchQueries[DASHBOARD_TABS.JOB].toLowerCase();
    const rawJobs = [...(data?.jd || [])];

    if (rawJobs.length === 0) {
      // E2E Dummy Data Injection Removed
    }

    const jobs = rawJobs;

    return jobs.filter(j => {
      // 検索対象のフィールドを定義
      const id = j.id || '';
      const jdNumber = j.id || ''; // JD_Number is often the ID
      const positionName = j.positionName || '';

      // Also check raw fields for safety
      const rawTitle = j.rawData.title || '';
      const rawJdNumber = j.rawData.JD_Number || '';

      return (
        id.toLowerCase().includes(query) ||
        jdNumber.toLowerCase().includes(query) ||
        positionName.toLowerCase().includes(query) ||
        rawTitle.toLowerCase().includes(query) ||
        rawJdNumber.toLowerCase().includes(query)
      );
    }).sort((a, b) => (b.rawData.createdAt || 0) - (a.rawData.createdAt || 0));
  }, [data?.jd, searchQueries[DASHBOARD_TABS.JOB]]);

  // Selection Tab Data
  /**
   * Aggregates selection process data for the overview flow.
   * @type {Array<Object>}
   */
  const selectionFlowData = useMemo(() => {
    const fmjs = data?.fmjs || [];
    const counts = { entry: 0, doc_pass: 0, interview_1: 0, interview_final: 0, offer: 0 };

    fmjs.forEach(item => {
      const phases = item.progress[SelectionProgress.FIELDS.PHASE] || {};
      if (phases['応募_書類選考']) counts.entry++;
      if (phases['1次面接']) counts.doc_pass++;
      if (phases['2次面接'] || phases['最終面接']) counts.interview_1++;
      if (phases['内定']) counts.interview_final++;
      if (phases['内定受諾']) counts.offer++;
    });

    /**
     * Calculates the percentage rate between steps.
     * @param {number} curr - Current count.
     * @param {number} prev - Previous count.
     * @returns {string} The percentage string.
     */
    const calcRate = (curr, prev) => prev === 0 ? '0%' : `${Math.round((curr / prev) * 100)}%`;

    return [
      { id: 'entry', label: 'エントリー', count: counts.entry, key: '応募_書類選考', rate: '100%' },
      { id: 'doc_pass', label: '書類合格', count: counts.doc_pass, key: '1次面接', rate: calcRate(counts.doc_pass, counts.entry) },
      { id: 'interview_1', label: '一次通過', count: counts.interview_1, key: '2次面接', rate: calcRate(counts.interview_1, counts.doc_pass) },
      { id: 'interview_final', label: '最終通過', count: counts.interview_final, key: '内定', rate: calcRate(counts.interview_final, counts.interview_1) },
      { id: 'offer', label: '内定承諾', count: counts.offer, key: '内定受諾', rate: calcRate(counts.offer, counts.interview_final) },
    ];
  }, [data?.fmjs]);

  /**
   * Filters selection list based on search query.
   * @type {Array<SelectionProgress>}
   */
  const filteredSelections = useMemo(() => {
    const query = searchQueries.selection.toLowerCase();
    const fmjs = data?.fmjs || [];

    return fmjs.filter(s =>
      (s.rawData.JobStatID && s.rawData.JobStatID.toLowerCase().includes(query)) ||
      (s.progress[SelectionProgress.FIELDS.INDIVIDUAL_ID] && s.progress[SelectionProgress.FIELDS.INDIVIDUAL_ID].toLowerCase().includes(query))
    ).sort((a, b) => (b.rawData.UpdateTimestamp_yyyymmddtttttt || 0) - (a.rawData.UpdateTimestamp_yyyymmddtttttt || 0));
  }, [data?.fmjs, searchQueries.selection]);

  // Modal Data (Drill-down)
  /**
   * Filters data for the drill-down modal.
   * @type {Array<SelectionProgress>}
   */
  const modalData = useMemo(() => {
    if (!modalFilter) return [];
    const fmjs = data?.fmjs || [];

    return fmjs.filter(item => {
      const phases = item.progress[SelectionProgress.FIELDS.PHASE] || {};
      return phases[modalFilter.key] === true;
    });
  }, [data?.fmjs, modalFilter]);

  // ---------------------------
  // Chart Data (Static for Overview)
  // ---------------------------
  const userGrowthData = [
    { value: 77, label: '1月', frontColor: '#2196F3' },
    { value: 155, label: '2月', frontColor: '#2196F3' },
    { value: 232, label: '3月', frontColor: '#2196F3' }
  ];

  const connectionTrendsData = [
    { value: 9, label: '1月' },
    { value: 18, label: '2月' },
    { value: 36, label: '3月' },
    { value: 54, label: '4月' },
    { value: 81, label: '5月' },
    { value: 90, label: '6月' },
  ];

  // ---------------------------
  // Helper Functions Binding
  // ---------------------------
  /**
   * Resolves the company name from ID.
   * @param {string} id - The company ID.
   * @returns {string} The company name.
   */
  const resolveCompanyName = (id) => getCompanyName(id, data?.corporate);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <View style={styles.container} testID='dashboard_screen'>
      {/* Header */}
      <ScreenHeader
        title='管理ダッシュボード'
        showBack={false}
        rightAction={<NotificationIcon />}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const tintColor = isActive ? '#2196F3' : '#666';

          return (
            <BottomNavItem
              key={tab.id}
              testID={`tab_${tab.id}`}
              isActive={isActive}
              label={tab.icon ? undefined : tab.label}
              icon={tab.icon ? <DashboardIcon color={tintColor} /> : undefined}
              onPress={() => setActiveTab(tab.id)}
              style={isActive ? styles.activeTabItem : styles.tabItem}
              textStyle={isActive ? styles.activeTabText : styles.tabText}
            />
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        {activeTab === DASHBOARD_TABS.DASHBOARD && (
          <OverviewTab
            selectionFlowData={selectionFlowData}
            userGrowthData={userGrowthData}
            connectionTrendsData={connectionTrendsData}
            onStepPress={(step) => {
              console.log('Step pressed:', step.id);
              setModalFilter({ key: step.key });
              setModalTitle(`${step.label} 一覧`);
              setModalVisible(true);
            }}
          />
        )}
        {activeTab === DASHBOARD_TABS.INDIVIDUAL && (
          <IndividualTab
            searchQuery={searchQueries[DASHBOARD_TABS.INDIVIDUAL]}
            setSearchQuery={(t) => updateSearch(DASHBOARD_TABS.INDIVIDUAL, t)}
            filteredUsers={filteredUsers}
            extractSkills={extractSkills}
            getHighDensityHeatmapData={getHighDensityHeatmapData}
            onUserPress={(item) => setSelectedUserId(item.id)}
          />
        )}
        {activeTab === DASHBOARD_TABS.COMPANY && (
          <CompanyTab
            searchQuery={searchQueries[DASHBOARD_TABS.COMPANY]}
            setSearchQuery={(t) => updateSearch(DASHBOARD_TABS.COMPANY, t)}
            filteredCompanies={filteredCompanies}
          />
        )}
        {activeTab === DASHBOARD_TABS.JOB && (
          <JobTab
            searchQuery={searchQueries[DASHBOARD_TABS.JOB]}
            setSearchQuery={(t) => updateSearch(DASHBOARD_TABS.JOB, t)}
            filteredJobs={filteredJobs}
            extractSkills={extractSkills}
            getHighDensityHeatmapData={getHighDensityHeatmapData}
            getCompanyName={resolveCompanyName}
            onJobPress={(item) => {
              setSelectedJobDoc(item);
              setSelectedJobId(item.id);
            }}
          />
        )}
        {activeTab === DASHBOARD_TABS.SELECTION && (
          <SelectionTab
            searchQuery={searchQueries[DASHBOARD_TABS.SELECTION]}
            setSearchQuery={(t) => updateSearch(DASHBOARD_TABS.SELECTION, t)}
            filteredSelections={filteredSelections}
          />
        )}
      </View>

      {/* Modals */}
      <DrillDownModal
        visible={modalVisible}
        title={modalTitle}
        data={modalData}
        onClose={() => setModalVisible(false)}
      />

      <UserDetailModal
        visible={!!selectedUserId}
        onClose={closeUserDetail}
        loading={selectedUserLoading}
        error={selectedUserError}
        userDoc={selectedUserDoc}
        userId={selectedUserId}
      />

      <JobDetailModal
        visible={!!selectedJobId}
        onClose={closeJobDetail}
        jobDoc={selectedJobDoc}
      />
    </View>
  );
}
