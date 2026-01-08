import React, { useState, useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, TextInput, FlatList, Modal } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import Svg, { Rect, Path } from 'react-native-svg';
import { DataContext } from '@shared/src/core/state/DataContext';

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
// Helper Components
// ---------------------------

// Dashboard Icon Component
const DashboardIcon = ({ color }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" fill={color} />
    <Rect x="14" y="3" width="7" height="7" rx="1" fill={color} />
    <Rect x="14" y="14" width="7" height="7" rx="1" fill={color} />
    <Rect x="3" y="14" width="7" height="7" rx="1" fill={color} />
  </Svg>
);

// Notification Icon Component
const NotificationIcon = () => (
  <View style={styles.notificationContainer}>
    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
       <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
       <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>3</Text>
    </View>
  </View>
);

// Search Bar Component
const SearchSection = ({ searchQuery, setSearchQuery, placeholder, quickFilters, onApplyFilter }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilterContainer}>
      {quickFilters.map((filter, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.quickFilterChip}
          onPress={() => onApplyFilter(filter.value)}
        >
          <Text style={styles.quickFilterText}>{filter.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// Generic List Component
const DataList = ({ data, renderItem }) => (
  <FlatList
    data={data}
    renderItem={renderItem}
    keyExtractor={(item) => item.id || item.JobStatID || Math.random().toString()}
    contentContainerStyle={styles.listContainer}
    ListEmptyComponent={<Text style={styles.emptyText}>データがありません</Text>}
  />
);

// ---------------------------
// Main Component
// ---------------------------
export default function DashboardScreen() {
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

  const updateSearch = (tab, text) => {
    setSearchQueries(prev => ({ ...prev, [tab]: text }));
  };

  // ---------------------------
  // Data Aggregation & Filtering
  // ---------------------------

  // Helper to parse FMJS timestamp (YYYYMMDDtttttt)
  const parseFmjsTimestamp = (ts) => {
    if (!ts) return null;
    const str = ts.toString();
    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10) - 1;
    const day = parseInt(str.substring(6, 8), 10);
    return new Date(year, month, day);
  };

  // Individual Tab Data
  const filteredUsers = useMemo(() => {
    const query = searchQueries.individual.toLowerCase();
    return (data?.users || []).filter(u => 
      (u.id && u.id.toLowerCase().includes(query)) ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Newest first
  }, [data?.users, searchQueries.individual]);

  // Company Tab Data
  const filteredCompanies = useMemo(() => {
    const query = searchQueries.company.toLowerCase();
    return (data?.corporate || []).filter(c => 
      (c.id && c.id.toLowerCase().includes(query)) ||
      (c.companyName && c.companyName.toLowerCase().includes(query))
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [data?.corporate, searchQueries.company]);

  // Job Tab Data
  const filteredJobs = useMemo(() => {
    const query = searchQueries.job.toLowerCase();
    return (data?.jd || []).filter(j => 
      (j.id && j.id.toLowerCase().includes(query)) ||
      (j.JD_Number && j.JD_Number.toLowerCase().includes(query)) ||
      (j.title && j.title.toLowerCase().includes(query))
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
  // Render Functions
  // ---------------------------

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Selection Process Flow */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>選考プロセス (FMJS)</Text>
        <View style={styles.displayBadge}>
          <Text style={styles.displayBadgeText}>表示: 件数</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flowContainer} contentContainerStyle={{paddingRight: 20}}>
        {selectionFlowData.map((step, index) => (
          <React.Fragment key={step.id}>
            <TouchableOpacity 
              style={styles.whiteCard}
              onPress={() => {
                setModalFilter({ key: step.key });
                setModalTitle(`${step.label} 一覧`);
                setModalVisible(true);
              }}
            >
              <Text style={styles.cardCount}>{step.count}<Text style={styles.unitText}>件</Text></Text>
              <Text style={styles.cardLabel}>{step.label}</Text>
              <Text style={styles.cardRate}>{step.rate}</Text>
            </TouchableOpacity>
            {index < selectionFlowData.length - 1 && (
              <View style={styles.arrowContainer}><Text style={styles.arrow}>→</Text></View>
            )}
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Middle Row: Satisfaction & Growth */}
      <View style={styles.rowContainer}>
        {/* Matching Satisfaction */}
        <View style={[styles.halfCard, { marginRight: 10 }]}>
          <Text style={styles.cardTitle}>マッチング満足度</Text>
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <PieChart
              data={[
                { value: 20, color: '#4CAF50' }, // 大変満足
                { value: 30, color: '#8BC34A' }, // 満足
                { value: 20, color: '#FFEB3B' }, // 普通
                { value: 10, color: '#FF9800' }, // 不満
                { value: 5, color: '#F44336' }, // 大変不満
              ]}
              donut
              radius={45}
              innerRadius={30}
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#4CAF50'}]}/><Text style={styles.legendText}>大変満足</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#8BC34A'}]}/><Text style={styles.legendText}>満足</Text></View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#FFEB3B'}]}/><Text style={styles.legendText}>普通</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#FF9800'}]}/><Text style={styles.legendText}>不満</Text></View>
            </View>
            <View style={styles.legendRow}>
               <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#F44336'}]}/><Text style={styles.legendText}>大変不満</Text></View>
            </View>
          </View>
        </View>

        {/* User Growth */}
        <View style={[styles.halfCard, { marginLeft: 0 }]}>
          <Text style={styles.cardTitle}>登録ユーザー数推移</Text>
          <BarChart
            data={userGrowthData}
            width={SCREEN_WIDTH * 0.28}
            height={120}
            barWidth={18}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
          />
        </View>
      </View>

      {/* Connection Trends */}
      <View style={styles.fullCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>繋がりの推移</Text>
          <View style={styles.segmentControl}>
            <View style={styles.segmentActive}><Text style={styles.segmentTextActive}>個人×企業</Text></View>
            <View style={styles.segmentInactive}><Text style={styles.segmentTextInactive}>個人×個人</Text></View>
          </View>
        </View>
        <LineChart
          data={connectionTrendsData}
          color="#FF9800"
          thickness={3}
          yAxisThickness={0}
          xAxisThickness={0}
          height={150}
          hideDataPoints={false}
          dataPointsColor="#FF9800"
        />
      </View>
    </ScrollView>
  );

  const renderIndividualTab = () => (
    <View style={styles.tabContent}>
      <SearchSection 
        searchQuery={searchQueries.individual} 
        setSearchQuery={(t) => updateSearch('individual', t)}
        placeholder="名前、メール、IDで検索"
        quickFilters={[
          { label: '今月登録', value: 'this_month' },
          { label: 'エンジニア', value: 'engineer' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
      />
      <DataList 
        data={filteredUsers}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>{item.name || '名称未設定'}</Text>
            <Text style={styles.itemSubtitle}>ID: {item.id}</Text>
            <Text style={styles.itemDetail}>{item.email}</Text>
          </View>
        )}
      />
    </View>
  );

  const renderCompanyTab = () => (
    <View style={styles.tabContent}>
      <SearchSection 
        searchQuery={searchQueries.company} 
        setSearchQuery={(t) => updateSearch('company', t)}
        placeholder="会社名、IDで検索"
        quickFilters={[
          { label: '契約中', value: 'active' },
          { label: '今月契約', value: 'new' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
      />
      <DataList 
        data={filteredCompanies}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>{item.companyName || '名称未設定'}</Text>
            <Text style={styles.itemSubtitle}>ID: {item.id}</Text>
            <Text style={styles.itemDetail}>{item.address || '-'}</Text>
          </View>
        )}
      />
    </View>
  );

  const renderJobTab = () => (
    <View style={styles.tabContent}>
      <SearchSection 
        searchQuery={searchQueries.job} 
        setSearchQuery={(t) => updateSearch('job', t)}
        placeholder="職種、JD番号で検索"
        quickFilters={[
          { label: '募集中', value: 'open' },
          { label: '急募', value: 'urgent' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
      />
      <DataList 
        data={filteredJobs}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>{item.title || 'タイトル未設定'}</Text>
            <Text style={styles.itemSubtitle}>JD No: {item.JD_Number}</Text>
            <Text style={styles.itemDetail}>Company ID: {item.company_ID}</Text>
          </View>
        )}
      />
    </View>
  );

  const renderSelectionTab = () => (
    <View style={styles.tabContent}>
      <SearchSection 
        searchQuery={searchQueries.selection} 
        setSearchQuery={(t) => updateSearch('selection', t)}
        placeholder="JobStatID、個人IDで検索"
        quickFilters={[
          { label: '選考中', value: 'active' },
          { label: '内定', value: 'offer' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
      />
      <DataList 
        data={filteredSelections}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.itemTitle}>JobStatID: {item.JobStatID}</Text>
            <Text style={styles.itemSubtitle}>個人: {item['選考進捗']?.['id_individual_個人ID']}</Text>
            <Text style={styles.itemDetail}>求人: {item['選考進捗']?.['JD_Number']}</Text>
            <Text style={styles.statusBadge}>
               {Object.keys(item['選考進捗']?.['status_ステータス'] || {}).filter(k => item['選考進捗']['status_ステータス'][k]).join(', ')}
            </Text>
          </View>
        )}
      />
    </View>
  );

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
        {activeTab === 'dashboard' && renderOverviewTab()}
        {activeTab === 'individual' && renderIndividualTab()}
        {activeTab === 'company' && renderCompanyTab()}
        {activeTab === 'job' && renderJobTab()}
        {activeTab === 'selection' && renderSelectionTab()}
      </View>

      {/* Drill-down Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <DataList 
            data={modalData}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={styles.itemTitle}>JobStatID: {item.JobStatID}</Text>
                <Text style={styles.itemSubtitle}>個人: {item['選考進捗']?.['id_individual_個人ID']}</Text>
                <Text style={styles.itemDetail}>更新日: {item.UpdateTimestamp_yyyymmddtttttt}</Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  notificationContainer: { position: 'relative', padding: 5 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: 'red', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', minHeight: 48, justifyContent: 'center' },
  activeTabItem: { borderBottomColor: '#2196F3' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#2196F3', fontWeight: 'bold' },
  
  contentArea: { flex: 1 },
  tabContent: { flex: 1, padding: 15 },
  
  // New Dashboard Styles
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444' },
  displayBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  displayBadgeText: { color: '#2196F3', fontSize: 12, fontWeight: 'bold' },
  
  flowContainer: { flexDirection: 'row', marginBottom: 20 },
  whiteCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, minWidth: 100, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardCount: { fontSize: 22, fontWeight: 'bold', color: '#2196F3', marginBottom: 2 },
  unitText: { fontSize: 12, color: '#666', fontWeight: 'normal' },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  cardRate: { fontSize: 11, color: '#999' },
  
  arrowContainer: { justifyContent: 'center', paddingHorizontal: 10 },
  arrow: { color: '#ccc', fontSize: 20 },
  
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  halfCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  fullCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  legendContainer: { marginTop: 5 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: '#666' },
  
  segmentControl: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 2 },
  segmentActive: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.1, shadowRadius:1, elevation: 1 },
  segmentInactive: { paddingHorizontal: 10, paddingVertical: 4 },
  segmentTextActive: { fontSize: 12, color: '#333', fontWeight: 'bold' },
  segmentTextInactive: { fontSize: 12, color: '#999' },

  // Search
  searchContainer: { marginBottom: 10 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8 },
  quickFilterContainer: { flexDirection: 'row' },
  quickFilterChip: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  quickFilterText: { fontSize: 12, color: '#333' },
  
  // List
  listContainer: { paddingBottom: 20 },
  listItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemSubtitle: { fontSize: 14, color: '#666', marginBottom: 2 },
  itemDetail: { fontSize: 12, color: '#999' },
  statusBadge: { marginTop: 4, fontSize: 12, color: '#2196F3', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 8 },
  closeButtonText: { color: '#2196F3', fontSize: 16 },
});
