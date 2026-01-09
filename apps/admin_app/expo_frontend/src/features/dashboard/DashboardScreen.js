import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, TextInput, FlatList, Modal, Pressable, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import Svg, { Rect, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { HeatmapGrid } from '@shared/src/core/components/HeatmapGrid';
import { HeatmapCalculator } from '@shared/src/core/utils/HeatmapCalculator';
import { HeatmapMapper } from '@shared/src/core/utils/HeatmapMapper';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserDoc, setSelectedUserDoc] = useState(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState(null);
  const [selectedUserCache, setSelectedUserCache] = useState({});

  const updateSearch = (tab, text) => {
    setSearchQueries(prev => ({ ...prev, [tab]: text }));
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setSelectedUserDoc(null);
    setSelectedUserLoading(false);
    setSelectedUserError(null);
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

  // Helper to parse FMJS timestamp (YYYYMMDDtttttt)
  const parseFmjsTimestamp = (ts) => {
    if (!ts) return null;
    const str = ts.toString();
    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10) - 1;
    const day = parseInt(str.substring(6, 8), 10);
    return new Date(year, month, day);
  };

  // Helper to extract skills recursively
  const extractSkills = (user) => {
    const skills = { core: [], sub1: [], sub2: [] };
    const root = user?.['スキル経験']?.['現職種']?.['技術職'];
    if (!root) return skills;

    const traverse = (obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (value.core_skill) skills.core.push(key);
          if (value.sub1) skills.sub1.push(key);
          if (value.sub2) skills.sub2.push(key);
          
          traverse(value);
        }
      });
    };

    traverse(root);
    return skills;
  };

  // Helper to calculate high density heatmap area
  const getHighDensityHeatmapData = (userData) => {
    // Use skills-only calculation as requested
    const fullGrid = HeatmapCalculator.calculateSkillsOnly(userData);
    const ROWS = 10;
    const COLS = 9;
    const WINDOW_ROWS = 3; // 縦3 (Requested: 3)
    const WINDOW_COLS = 4; // 横4 (Requested: 4)

    let maxScore = -1;
    let bestStartRow = 0;
    let bestStartCol = 0;

    // Sliding window to find highest density
    for (let r = 0; r <= ROWS - WINDOW_ROWS; r++) {
      for (let c = 0; c <= COLS - WINDOW_COLS; c++) {
        let currentScore = 0;
        for (let wr = 0; wr < WINDOW_ROWS; wr++) {
          for (let wc = 0; wc < WINDOW_COLS; wc++) {
            const index = (r + wr) * COLS + (c + wc);
            currentScore += fullGrid[index] || 0;
          }
        }
        if (currentScore > maxScore) {
          maxScore = currentScore;
          bestStartRow = r;
          bestStartCol = c;
        }
      }
    }

    // Extract data for the best window
    const windowData = [];
    for (let wr = 0; wr < WINDOW_ROWS; wr++) {
      for (let wc = 0; wc < WINDOW_COLS; wc++) {
        const index = (bestStartRow + wr) * COLS + (bestStartCol + wc);
        windowData.push({
          value: fullGrid[index] || 0,
          id: index // Keep original index for label lookup
        });
      }
    }

    return { data: windowData, rows: WINDOW_ROWS, cols: WINDOW_COLS };
  };

  // Mini Heatmap Component
  const MiniHeatmap = ({ data, rows, cols }) => {
    const [selectedTile, setSelectedTile] = useState(null);

    // Calculate tile size based on individual_user_app logic, then reduced to 70%
    // containerWidth = width - 40 (padding)
    // tileSize = (containerWidth / 9) - 4 (margin)
    const baseTileSize = ((SCREEN_WIDTH - 40) / 9) - 4;
    const standardTileSize = baseTileSize * 0.7; // 70% size
    
    const getColor = (value) => {
      if (value === 0) return '#E2E8F0';
      if (value <= 0.2) return '#BAE6FD';
      if (value <= 0.5) return '#7DD3FC';
      if (value <= 0.8) return THEME.accent;
      return '#0369A1';
    };

    const handlePress = (item, index) => {
      if (selectedTile && selectedTile.id === item.id) {
        setSelectedTile(null);
        return;
      }

      const label = HeatmapMapper.getLabel(item.id) || `Tile ${item.id}`;
      
      // Calculate level (0-4)
      let level = 0;
      const v = item.value;
      if (v > 0.8) level = 4;
      else if (v > 0.5) level = 3;
      else if (v > 0.2) level = 2;
      else if (v > 0) level = 1;

      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Calculate approximate position
      const totalTileSize = standardTileSize + 2; // 2px margin (1px each side)
      
      // Tooltip settings
      const tooltipWidth = 90;
      const tooltipHeightApprox = 44;
      
      // Center horizontally relative to tile
      let left = (col * totalTileSize) + (totalTileSize / 2) - (tooltipWidth / 2);
      
      // Constrain to container width (approx)
      const containerWidth = cols * totalTileSize;
      left = Math.max(-20, Math.min(containerWidth - tooltipWidth + 20, left)); // Allow some overflow
      
      const showAbove = row >= Math.max(0, rows - 2);
      const top = showAbove
        ? (row * totalTileSize) - tooltipHeightApprox - 8
        : ((row + 1) * totalTileSize) + 8;

      setSelectedTile({
        id: item.id,
        label,
        level,
        top,
        left,
        showAbove,
        arrowLeft: (col * totalTileSize) + (totalTileSize / 2) - left - 6,
      });
    };

    return (
      <View style={{ position: 'relative', width: cols * (standardTileSize + 2) }} onStartShouldSetResponder={() => true}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {data.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={{
                width: standardTileSize,
                height: standardTileSize,
                backgroundColor: getColor(item.value),
                margin: 1,
                borderRadius: 4, // Match HeatmapGrid
                borderWidth: selectedTile?.id === item.id ? 2 : 0,
                borderColor: '#334155',
                zIndex: 1
              }}
              onPress={(e) => {
                e.stopPropagation(); // Prevent list item press
                handlePress(item, i);
              }}
              activeOpacity={0.7}
            />
          ))}
        </View>

        {selectedTile && (
          <View style={[
            styles.tooltip, 
            { 
              top: selectedTile.top,
              left: selectedTile.left,
              width: 90,
              padding: 6,
              borderRadius: 6,
              position: 'absolute',
              zIndex: 999
            }
          ]}>
            <View
              style={[
                styles.tooltipArrow,
                selectedTile.showAbove ? styles.arrowDown : styles.arrowUp,
                { left: selectedTile.arrowLeft },
              ]}
            />
            <Text style={[styles.tooltipTitle, { fontSize: 10, marginBottom: 2 }]} numberOfLines={1}>
              {selectedTile.label}
            </Text>
            <Text style={[styles.tooltipText, { fontSize: 10 }]}>
              Lv {selectedTile.level}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
        placeholder="名前、住所、学校名、IDなどで検索"
        quickFilters={[
          { label: '今月登録', value: 'this_month' },
          { label: 'エンジニア', value: 'engineer' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
      />
      <DataList 
        data={filteredUsers}
        renderItem={({ item }) => {
          const skills = extractSkills(item);
          const fullName = (item['基本情報']?.['姓'] && item['基本情報']?.['名']) 
            ? `${item['基本情報']['姓']} ${item['基本情報']['名']}`
            : (item.name || '名称未設定');
          
          const hasAnySkill = skills.core.length > 0 || skills.sub1.length > 0 || skills.sub2.length > 0;
          const heatmapInfo = getHighDensityHeatmapData(item);

          return (
            <TouchableOpacity 
              style={styles.glassListItem}
              activeOpacity={0.7}
              onPress={() => setSelectedUserId(item.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={styles.listItemHeader}>
                    <View>
                      <Text style={styles.itemTitleModern}>{fullName}</Text>
                      <Text style={styles.itemSubtitleModern}>ID: {item.id}</Text>
                    </View>
                  </View>
                  
                  {hasAnySkill && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.skillScrollContainer}
                    >
                      {skills.core.map((skill, i) => (
                        <GlassCard
                          key={`core-${i}`}
                          label={i === 0 ? "CORE" : ""}
                          skillName={skill}
                          width={60}
                          style={{ marginRight: 6 }}
                          badgeStyle={{
                            backgroundColor: 'rgba(14, 165, 233, 0.15)',
                            borderColor: THEME.accent,
                            borderWidth: 1,
                          }}
                          skillNameStyle={{
                            color: THEME.accent,
                            fontSize: 9,
                            fontWeight: 'bold',
                            marginBottom: 0,
                          }}
                        />
                      ))}

                      {skills.sub1.map((skill, i) => (
                        <GlassCard
                          key={`sub1-${i}`}
                          label={i === 0 ? "Sub 1" : ""}
                          skillName={skill}
                          width={42}
                          style={{ marginRight: 6 }}
                          labelStyle={{ fontSize: 9, marginBottom: 3 }}
                          badgeStyle={{
                            backgroundColor: 'rgba(14, 165, 233, 0.10)',
                            borderColor: 'rgba(14, 165, 233, 0.3)',
                            borderWidth: 1,
                            borderRadius: 10,
                          }}
                          skillNameStyle={{
                            color: '#0369A1',
                            fontSize: 8,
                            fontWeight: 'bold',
                            marginBottom: 0,
                          }}
                        />
                      ))}

                      {skills.sub2.map((skill, i) => (
                        <GlassCard
                          key={`sub2-${i}`}
                          label={i === 0 ? "Sub 2" : ""}
                          skillName={skill}
                          width={42}
                          style={{ marginRight: 6 }}
                          labelStyle={{ fontSize: 9, marginBottom: 3 }}
                          badgeStyle={{
                            backgroundColor: 'rgba(14, 165, 233, 0.05)',
                            borderColor: 'rgba(14, 165, 233, 0.2)',
                            borderWidth: 1,
                            borderRadius: 10,
                          }}
                          skillNameStyle={{
                            color: '#075985',
                            fontSize: 8,
                            marginBottom: 0,
                          }}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Heatmap Area */}
                <View style={{ paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.5)' }}>
                  <MiniHeatmap data={heatmapInfo.data} rows={heatmapInfo.rows} cols={heatmapInfo.cols} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
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

      {/* User Detail Window (individual_user_app-like, in-app modal) */}
      <Modal
        visible={!!selectedUserId}
        transparent
        animationType="fade"
        onRequestClose={closeUserDetail}
      >
        <Pressable style={styles.detailOverlay} onPress={closeUserDetail}>
          <Pressable style={styles.detailWindow} onPress={(e) => e.stopPropagation()}>
            <View style={styles.detailWindowHeader}>
              <Text style={styles.detailWindowTitle}>個人ユーザー詳細</Text>
              <TouchableOpacity onPress={closeUserDetail} style={styles.detailWindowClose}>
                <Text style={styles.detailWindowCloseText}>閉じる</Text>
              </TouchableOpacity>
            </View>

            {selectedUserLoading && (
              <View style={styles.detailWindowLoading}>
                <ActivityIndicator size="large" color={THEME.accent} />
                <Text style={styles.detailWindowLoadingText}>読み込み中...</Text>
              </View>
            )}

            {!selectedUserLoading && selectedUserError && (
              <View style={styles.detailWindowLoading}>
                <Text style={styles.detailWindowErrorText}>{selectedUserError}</Text>
              </View>
            )}

            {!selectedUserLoading && !selectedUserError && selectedUserDoc && (
              <ScrollView contentContainerStyle={styles.detailWindowScrollContent} bounces={false}>
                {(() => {
                  const basicInfo = selectedUserDoc['基本情報'] || {};
                  const family = basicInfo['姓'] || '';
                  const first = basicInfo['名'] || '';
                  const mail = basicInfo['メール'] || basicInfo['メールアドレス'] || '';
                  const backgroundUri = basicInfo['背景画像URL'];
                  const profileUri = basicInfo['プロフィール画像URL'];

                  const skills = extractSkills(selectedUserDoc);
                  const coreSkill = skills.core[0] || '-';
                  const sub1Skill = skills.sub1[0] || '-';
                  const sub2Skill = skills.sub2[0] || '-';

                  const heatmapValues = HeatmapCalculator.calculate(selectedUserDoc);

                  return (
                    <>
                      <ImageBackground
                        source={backgroundUri ? { uri: backgroundUri } : undefined}
                        style={styles.detailHero}
                        imageStyle={styles.detailHeroImage}
                      >
                        <View style={styles.detailHeroTopRow}>
                          <Text style={styles.detailHeroId}>ID: {selectedUserId}</Text>
                        </View>

                        <View style={styles.detailHeroProfileRow}>
                          <View style={styles.detailPhotoContainer}>
                            <Image
                              source={{
                                uri: profileUri || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400',
                              }}
                              style={styles.detailProfileImage}
                            />
                          </View>
                          <View style={styles.detailNamePlate}>
                            <Text style={styles.detailNameText}>{`${family} ${first}`.trim() || '名称未設定'}</Text>
                            <Text style={styles.detailJobTitle}>フロントエンドエンジニア</Text>
                            <Text style={styles.detailEmailText}>{mail || '-'}</Text>
                            <Text style={styles.detailSourceText}>データ元: Firestore (individual)</Text>
                          </View>
                        </View>
                      </ImageBackground>

                      <View style={styles.detailBadgeSection}>
                        <View style={styles.detailBadgeRow}>
                          <GlassCard
                            label="コアスキル"
                            skillName={coreSkill}
                            width={(styles.detailBadgeRow.width - 12) / 3}
                            labelStyle={styles.detailCardLabel}
                            badgeStyle={styles.detailGlassBadge}
                            skillNameStyle={styles.detailCardSkillName}
                          />
                          <GlassCard
                            label="サブスキル1"
                            skillName={sub1Skill}
                            width={(styles.detailBadgeRow.width - 12) / 3}
                            labelStyle={styles.detailCardLabel}
                            badgeStyle={styles.detailGlassBadge}
                            skillNameStyle={styles.detailCardSkillName}
                          />
                          <GlassCard
                            label="サブスキル2"
                            skillName={sub2Skill}
                            width={(styles.detailBadgeRow.width - 12) / 3}
                            labelStyle={styles.detailCardLabel}
                            badgeStyle={styles.detailGlassBadge}
                            skillNameStyle={styles.detailCardSkillName}
                          />
                        </View>
                      </View>

                      <View style={styles.detailHeatmapSection}>
                        <Text style={styles.detailHeatmapTitle}>スキル・志向ヒートマップ</Text>
                        <View style={{ alignItems: 'center', marginTop: 10 }}>
                          <HeatmapGrid
                            containerWidth={SCREEN_WIDTH * 0.8 - 40}
                            dataValues={heatmapValues}
                          />
                        </View>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  notificationContainer: { position: 'relative', padding: 5 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: 'red', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Tab Bar
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.8)', marginHorizontal: 20, borderRadius: 16, padding: 4, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, justifyContent: 'center' },
  activeTabItem: { backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tabText: { fontSize: 13, color: THEME.subText, fontWeight: '600' },
  activeTabText: { color: THEME.accent, fontWeight: 'bold' },
  
  contentArea: { flex: 1 },
  tabContent: { flex: 1, padding: 20 },
  
  // New Dashboard Styles
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  displayBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  displayBadgeText: { color: THEME.accent, fontSize: 12, fontWeight: 'bold' },
  
  // Search
  searchContainer: { marginBottom: 20 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  quickFilterContainer: { flexDirection: 'row', marginTop: 12 },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quickFilterText: { fontSize: 12, color: THEME.subText, fontWeight: '600' },

  // List Item (Legacy)
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  itemSubtitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  itemDetail: { fontSize: 12, color: '#999' },
  statusBadge: { marginTop: 8, fontSize: 12, color: '#2196F3', fontWeight: 'bold' },

  // Glass List Item (Modern)
  glassListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleModern: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 2,
  },
  itemSubtitleModern: {
    fontSize: 12,
    color: THEME.subText,
    fontWeight: '500',
  },
  statusBadgeModern: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextModern: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  skillScrollContainer: {
    paddingVertical: 4,
    paddingLeft: 10,
    alignItems: 'flex-start',
  },

  // Other components
  flowContainer: { marginBottom: 20 },
  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minWidth: 100,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCount: { fontSize: 24, fontWeight: 'bold', color: THEME.text, marginBottom: 4 },
  unitText: { fontSize: 12, color: THEME.subText, fontWeight: 'normal' },
  cardLabel: { fontSize: 12, color: THEME.subText, marginBottom: 4 },
  cardRate: { fontSize: 11, color: THEME.success, fontWeight: 'bold' },
  arrowContainer: { justifyContent: 'center', marginRight: 10 },
  arrow: { color: '#CBD5E1', fontSize: 20 },
  
  rowContainer: { flexDirection: 'row', marginBottom: 20 },
  halfCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  fullCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  segmentControl: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 2 },
  segmentActive: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  segmentInactive: { paddingHorizontal: 12, paddingVertical: 4 },
  segmentTextActive: { fontSize: 11, fontWeight: 'bold', color: THEME.text },
  segmentTextInactive: { fontSize: 11, color: THEME.subText },
  
  legendContainer: { marginTop: 10 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: THEME.subText },

  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 20 },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text },
  closeButton: { padding: 8 },
  closeButtonText: { color: THEME.accent, fontWeight: 'bold' },
  
  // User Detail
  detailHeader: { marginBottom: 20, alignItems: 'center' },
  detailName: { fontSize: 22, fontWeight: 'bold', color: THEME.text, marginBottom: 4 },
  detailId: { fontSize: 14, color: THEME.subText, marginBottom: 2 },
  detailInfo: { fontSize: 14, color: THEME.subText },
  skillListContainer: { marginTop: 10 },
  skillGroup: { marginBottom: 15 },
  skillGroupTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },
  skillBadges: { flexDirection: 'row', flexWrap: 'wrap' },
  skillBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  skillBadgeText: { fontSize: 12, fontWeight: '600' },

  // Tooltip Styles
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    padding: 10,
    borderRadius: 8,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(30, 41, 59, 0.95)',
  },
  arrowUp: {
    top: -6,
    transform: [{ rotate: '0deg' }],
  },
  arrowDown: {
    bottom: -6,
    transform: [{ rotate: '180deg' }],
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  tooltipText: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipSubText: {
    color: '#94a3b8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  detailWindow: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailWindowHeader: {
    height: 54,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailWindowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
  },
  detailWindowClose: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
  },
  detailWindowCloseText: {
    color: THEME.accent,
    fontWeight: '800',
    fontSize: 12,
  },
  detailWindowLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  detailWindowLoadingText: {
    color: THEME.subText,
    fontWeight: '600',
  },
  detailWindowErrorText: {
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'center',
  },
  detailWindowScrollContent: {
    paddingBottom: 24,
  },
  detailHero: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.8 * 0.32,
    backgroundColor: '#0F172A',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  detailHeroImage: {
    opacity: 0.92,
  },
  detailHeroTopRow: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailHeroId: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  detailHeroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailPhotoContainer: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#EEE',
    marginRight: 10,
  },
  detailProfileImage: {
    width: '100%',
    height: '100%',
  },
  detailNamePlate: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  detailNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.text,
    marginBottom: 2,
  },
  detailJobTitle: {
    fontSize: 11,
    color: THEME.accent,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailEmailText: {
    fontSize: 10,
    color: THEME.subText,
  },
  detailSourceText: {
    fontSize: 10,
    color: THEME.subText,
    marginTop: 4,
  },
  detailBadgeSection: {
    marginTop: -18,
    paddingHorizontal: 14,
  },
  detailBadgeRow: {
    width: SCREEN_WIDTH * 0.8 - 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCardLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailGlassBadge: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 230, 253, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  detailCardSkillName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  detailHeatmapSection: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  detailHeatmapTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.text,
  },
});
