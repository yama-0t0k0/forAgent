// 機能概要:
// - エージェント向け管理ダッシュボード画面
// - 選考ステータス、マッチング満足度、ユーザー登録推移の可視化
// - 離脱ユーザー管理と繋がりの推移分析機能
// - react-native-gifted-chartsライブラリを使用したインタラクティブなグラフ表示
//
// 主要機能:
// - 選考ステータス統計（件数/人数切替表示）
// - マッチング満足度パイチャート
// - 登録ユーザー数推移の棒グラフ
// - 離脱ユーザーリスト表示
// - 繋がりの推移ラインチャート（期間・カテゴリ別）
// - 詳細モーダル表示
//
// ディレクトリ構造:
// ├── apps/
// │   └── admin_app/
// │       └── expo_frontend/
// │           └── src/
// │               └── features/
// │                   └── dashboard/
// │                       └── DashboardScreen.js (本ファイル)
//
// デプロイ・実行方法:
// 1. npx expo start --tunnel --clear
//

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---------------------------
// 1. FMJS Selection Flow Data (Dummy)
// ---------------------------
const SELECTION_FLOW = [
  { id: 'entry', label: 'エントリー', count: 59, people: 55, rate: '100%' },
  { id: 'doc_pass', label: '書類合格', count: 59, people: 50, rate: '100%' },
  { id: 'interview_1', label: '一次通過', count: 21, people: 20, rate: '35.5%' },
  { id: 'interview_final', label: '最終通過', count: 8, people: 8, rate: '38.1%' },
  { id: 'offer', label: '内定承諾', count: 4, people: 4, rate: '50%' },
];

// ---------------------------
// 5. Satisfaction Data (Dummy)
// ---------------------------
const SATISFACTION_DATA = [
  { value: 45, color: '#4CAF50', text: '大変満足' },
  { value: 25, color: '#8BC34A', text: '満足' },
  { value: 15, color: '#FFEB3B', text: '普通' },
  { value: 10, color: '#FF9800', text: '不満' },
  { value: 5, color: '#F44336', text: '大変不満' },
];

// ---------------------------
// 6. User Growth Data (Dummy)
// ---------------------------
const USER_GROWTH_DATA = [
  { value: 100, label: '1月', frontColor: '#2196F3' },
  { value: 120, label: '2月', frontColor: '#2196F3' },
  { value: 150, label: '3月', frontColor: '#2196F3' },
  { value: 190, label: '4月', frontColor: '#2196F3' },
  { value: 240, label: '5月', frontColor: '#2196F3' },
  { value: 300, label: '6月', frontColor: '#2196F3' },
];

// ---------------------------
// 7. Connections Data (Dummy)
// ---------------------------
const CONNECTIONS_DATA_INDIVIDUAL_COMPANY = [
  { value: 10, label: '1w' }, { value: 20, label: '2w' }, { value: 45, label: '3w' }, { value: 80, label: '4w' }
];
const CONNECTIONS_DATA_INDIVIDUAL_INDIVIDUAL = [
  { value: 5, label: '1w' }, { value: 8, label: '2w' }, { value: 15, label: '3w' }, { value: 25, label: '4w' }
];

export default function DashboardScreen() {
  // State for toggles
  const [isCountMode, setIsCountMode] = useState(true); // 1. 件数/人数切り替え
  const [selectedConnectionTab, setSelectedConnectionTab] = useState('ind_comp'); // 7. カテゴリ切り替え
  const [selectedFlow, setSelectedFlow] = useState(null); // 2. 詳細モーダル

  // Connections Data Switcher
  const connectionData = selectedConnectionTab === 'ind_comp' 
    ? CONNECTIONS_DATA_INDIVIDUAL_COMPANY 
    : CONNECTIONS_DATA_INDIVIDUAL_INDIVIDUAL;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header / Notifications */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>管理ダッシュボード</Text>
        <TouchableOpacity style={styles.bellButton}>
          <Text style={styles.bellText}>🔔</Text>
          {/* Notification Badge */}
          <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
        </TouchableOpacity>
      </View>

      {/* 1. Selection Flow (FMJS) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>選考プロセス (FMJS)</Text>
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setIsCountMode(!isCountMode)}
          >
            <Text style={styles.toggleText}>{isCountMode ? '表示: 件数' : '表示: 人数'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flowContainer}>
          {SELECTION_FLOW.map((step, index) => (
            <React.Fragment key={step.id}>
              <TouchableOpacity 
                style={styles.flowCard}
                onPress={() => setSelectedFlow(step)} // 2. Click to detail
              >
                <Text style={styles.flowCount}>
                  {isCountMode ? step.count : step.people}
                  <Text style={styles.flowUnit}>{isCountMode ? '件' : '人'}</Text>
                </Text>
                <Text style={styles.flowLabel}>{step.label}</Text>
                <Text style={styles.flowRate}>{step.rate}</Text>
              </TouchableOpacity>
              {index < SELECTION_FLOW.length - 1 && (
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Grid for Charts */}
      <View style={styles.gridContainer}>
        
        {/* 5. Satisfaction Pie Chart */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>マッチング満足度</Text>
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={SATISFACTION_DATA}
              donut
              radius={60}
              innerRadius={40}
              showText
              textColor="black"
              textSize={10}
            />
          </View>
          <View style={styles.legendContainer}>
            {SATISFACTION_DATA.map((item, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. User Growth Bar Chart */}
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>登録ユーザー数推移</Text>
          <BarChart
            data={USER_GROWTH_DATA}
            width={SCREEN_WIDTH * 0.35}
            height={150}
            barWidth={20}
            noOfSections={4}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
          />
        </View>

      </View>

      {/* 7. Connections Line Chart */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>繋がりの推移</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectedConnectionTab === 'ind_comp' && styles.activeTab]}
              onPress={() => setSelectedConnectionTab('ind_comp')}
            >
              <Text style={[styles.tabText, selectedConnectionTab === 'ind_comp' && styles.activeTabText]}>個人×企業</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedConnectionTab === 'ind_ind' && styles.activeTab]}
              onPress={() => setSelectedConnectionTab('ind_ind')}
            >
              <Text style={[styles.tabText, selectedConnectionTab === 'ind_ind' && styles.activeTabText]}>個人×個人</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <LineChart
          data={connectionData}
          width={SCREEN_WIDTH - 80}
          height={180}
          color="#FF9800"
          thickness={3}
          dataPointsColor="#FF9800"
          startFillColor="rgba(255, 152, 0, 0.3)"
          endFillColor="rgba(255, 152, 0, 0.01)"
          startOpacity={0.9}
          endOpacity={0.2}
          areaChart
        />
      </View>

      {/* 4. Watchlist / Dropout Analysis (Mock UI) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ウォッチリスト / 離脱分析</Text>
        {[
          { id: 1, name: '鈴木 一郎', status: '登録途中', type: 'dropout', step: '職務経歴入力' },
          { id: 2, name: '佐藤 花子', status: '書類選考中', type: 'usecase', company: 'Tech Corp' },
          { id: 3, name: '田中 次郎', status: '登録完了', type: 'new', date: '2025-01-08' },
        ].map((user, idx) => (
          <View key={idx} style={styles.listItem}>
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userSub}>{user.type === 'dropout' ? `離脱: ${user.step}` : user.status}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: user.type === 'dropout' ? '#FFEBEE' : '#E3F2FD' }
            ]}>
              <Text style={{ color: user.type === 'dropout' ? '#D32F2F' : '#1976D2', fontSize: 12 }}>
                {user.type === 'dropout' ? '要フォロー' : '進行中'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Detail Modal */}
      <Modal visible={!!selectedFlow} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedFlow?.label}の詳細</Text>
            <Text>ここに {selectedFlow?.label} 段階の候補者リストや内訳を表示します。</Text>
            <Text style={{ marginTop: 10 }}>件数: {selectedFlow?.count}</Text>
            <Text>人数: {selectedFlow?.people}</Text>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedFlow(null)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  bellText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  toggleButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flowContainer: {
    flexDirection: 'row',
  },
  flowCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 8,
    width: 120,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  flowCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  flowUnit: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  flowLabel: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  flowRate: {
    fontSize: 10,
    color: '#666',
  },
  arrowContainer: {
    justifyContent: 'center',
    marginRight: 8,
  },
  arrow: {
    color: '#ccc',
    fontSize: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  halfCard: {
    width: '48%',
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
