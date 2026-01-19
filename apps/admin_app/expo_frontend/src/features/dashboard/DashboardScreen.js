import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// Styles
import { styles } from './dashboardStyles';

// Utils
import { extractSkills, getHighDensityHeatmapData, getCompanyName } from '@shared/src/core/utils/dashboardUtils';

// Components
import { DashboardIcon, NotificationIcon } from './components/common/DashboardHelpers';
import { OverviewTab } from './components/tabs/OverviewTab';
import { IndividualTab } from './components/tabs/IndividualTab';
import { CompanyTab } from './components/tabs/CompanyTab';
import { JobTab } from './components/tabs/JobTab';
import { SelectionTab } from './components/tabs/SelectionTab';
import { DrillDownModal } from './components/modals/DrillDownModal';
import { UserDetailModal } from './components/modals/UserDetailModal';
import { JobDetailModal } from './components/modals/JobDetailModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---------------------------
// Constants & Config
// ---------------------------
const TABS = [
  { id: 'dashboard', label: 'ホーム', icon: true },
  { id: 'individual', label: '個人' },
  { id: 'company', label: '法人' },
  { id: 'job', label: '求人' },
  { id: 'selection', label: '選考' },
];

// ---------------------------
// Main Component
// ---------------------------
export default function DashboardScreen() {
  const navigation = useNavigation();
  const { data } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Search States
  const [searchQueries, setSearchQueries] = useState({
    individual: '', company: '', job: '', selection: ''
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

  const updateSearch = (tab, text) => {
    setSearchQueries(prev => ({ ...prev, [tab]: text }));
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setSelectedUserDoc(null);
    setSelectedUserLoading(false);
    setSelectedUserError(null);
  };

  const closeJobDetail = () => {
    setSelectedJobId(null);
    setSelectedJobDoc(null);
  };

  useEffect(() => {
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
        const snap = await getDoc(doc(db, 'individual', selectedUserId));
        if (!snap.exists()) {
          setSelectedUserError(`individual/${selectedUserId} が見つかりませんでした`);
          setSelectedUserLoading(false);
          return;
        }
        const d = snap.data();
        setSelectedUserDoc(d);
        setSelectedUserCache(prev => ({ ...prev, [selectedUserId]: d }));
        setSelectedUserLoading(false);
      } catch (e) {
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
  const filteredUsers = useMemo(() => {
    const query = searchQueries.individual.toLowerCase();
    return (data?.users || []).filter(u => {
      const basicInfo = u['基本情報'] || {};
      const address = basicInfo['住所'] || {};
      const education = basicInfo['学歴詳細'] || {};

      const searchableText = [
        u.id,
        u.name,
        u.email,
        basicInfo['姓'],
        basicInfo['名'],
        basicInfo['メールアドレス'],
        address['都道府県or州など'],
        education['学校名']
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(query);
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Newest first
  }, [data?.users, searchQueries.individual]);

  // Company Tab Data
  const filteredCompanies = useMemo(() => {
    const query = searchQueries.company.toLowerCase();
    return (data?.corporate || []).filter(c =>
      (c.id && c.id.toLowerCase().includes(query)) ||
      (c.companyName && c.companyName.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query))
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [data?.corporate, searchQueries.company]);

  // Job Tab Data
  const filteredJobs = useMemo(() => {
    const query = searchQueries.job.toLowerCase();
    return (data?.jd || []).filter(j => {
      // 検索対象のフィールドを定義
      const id = j.id || '';
      const jdNumber = j.JD_Number || '';
      const positionName = j['求人基本項目']?.['ポジション名'] || '';
      const title = j.title || '';

      return (
        id.toLowerCase().includes(query) ||
        jdNumber.toLowerCase().includes(query) ||
        positionName.toLowerCase().includes(query) ||
        title.toLowerCase().includes(query)
      );
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [data?.jd, searchQueries.job]);

  // Selection Tab Data
  const selectionFlowData = useMemo(() => {
    const fmjs = data?.fmjs || [];
    const counts = { entry: 0, doc_pass: 0, interview_1: 0, interview_final: 0, offer: 0 };

    fmjs.forEach(item => {
      const phases = item['選考進捗']?.['fase_フェイズ'] || {};
      if (phases['応募_書類選考']) counts.entry++;
      if (phases['1次面接']) counts.doc_pass++;
      if (phases['2次面接'] || phases['最終面接']) counts.interview_1++;
      if (phases['内定']) counts.interview_final++;
      if (phases['内定受諾']) counts.offer++;
    });

    const calcRate = (curr, prev) => prev === 0 ? '0%' : `${Math.round((curr / prev) * 100)}%`;

    return [
      { id: 'entry', label: 'エントリー', count: counts.entry, key: '応募_書類選考', rate: '100%' },
      { id: 'doc_pass', label: '書類合格', count: counts.doc_pass, key: '1次面接', rate: calcRate(counts.doc_pass, counts.entry) },
      { id: 'interview_1', label: '一次通過', count: counts.interview_1, key: '2次面接', rate: calcRate(counts.interview_1, counts.doc_pass) },
      { id: 'interview_final', label: '最終通過', count: counts.interview_final, key: '内定', rate: calcRate(counts.interview_final, counts.interview_1) },
      { id: 'offer', label: '内定承諾', count: counts.offer, key: '内定受諾', rate: calcRate(counts.offer, counts.interview_final) },
    ];
  }, [data?.fmjs]);

  const filteredSelections = useMemo(() => {
    const query = searchQueries.selection.toLowerCase();
    return (data?.fmjs || []).filter(s =>
      (s.JobStatID && s.JobStatID.toLowerCase().includes(query)) ||
      (s['選考進捗']?.['id_individual_個人ID'] && s['選考進捗']['id_individual_個人ID'].toLowerCase().includes(query))
    ).sort((a, b) => (b.UpdateTimestamp_yyyymmddtttttt || 0) - (a.UpdateTimestamp_yyyymmddtttttt || 0));
  }, [data?.fmjs, searchQueries.selection]);

  // Modal Data (Drill-down)
  const modalData = useMemo(() => {
    if (!modalFilter) return [];
    return (data?.fmjs || []).filter(item => {
      const phases = item['選考進捗']?.['fase_フェイズ'] || {};
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
  const resolveCompanyName = (id) => getCompanyName(id, data?.corporate);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>管理ダッシュボード</Text>
        <NotificationIcon />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const tintColor = isActive ? '#2196F3' : '#666';

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
              onPress={() => setActiveTab(tab.id)}
            >
              {tab.icon ? (
                <DashboardIcon color={tintColor} />
              ) : (
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.contentArea}>
        {activeTab === 'dashboard' && (
          <OverviewTab
            selectionFlowData={selectionFlowData}
            userGrowthData={userGrowthData}
            connectionTrendsData={connectionTrendsData}
            onStepPress={(step) => {
              setModalFilter({ key: step.key });
              setModalTitle(`${step.label} 一覧`);
              setModalVisible(true);
            }}
          />
        )}
        {activeTab === 'individual' && (
          <IndividualTab
            searchQuery={searchQueries.individual}
            setSearchQuery={(t) => updateSearch('individual', t)}
            filteredUsers={filteredUsers}
            extractSkills={extractSkills}
            getHighDensityHeatmapData={getHighDensityHeatmapData}
            onUserPress={(item) => setSelectedUserId(item.id)}
          />
        )}
        {activeTab === 'company' && (
          <CompanyTab
            searchQuery={searchQueries.company}
            setSearchQuery={(t) => updateSearch('company', t)}
            filteredCompanies={filteredCompanies}
          />
        )}
        {activeTab === 'job' && (
          <JobTab
            searchQuery={searchQueries.job}
            setSearchQuery={(t) => updateSearch('job', t)}
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
        {activeTab === 'selection' && (
          <SelectionTab
            searchQuery={searchQueries.selection}
            setSearchQuery={(t) => updateSearch('selection', t)}
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
        extractSkills={extractSkills}
        navigation={navigation}
      />

      <JobDetailModal
        visible={!!selectedJobId}
        onClose={closeJobDetail}
        jobDoc={selectedJobDoc}
      />
    </View>
  );
}
