import { THEME } from '@shared/src/core/theme/theme';
import { SelectionProgress } from '@shared/src/core/models/SelectionProgress';
import SelectionFlowEditor from '@shared/src/features/selection/SelectionFlowEditor';
import { ScreenHeader } from '@shared/src/core/components/ScreenHeader';
import { useFirestore } from '@shared/src/core/utils/useFirestore';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { EmptyState, ErrorState } from '@shared/src/core/components/StateComponents';
import { FMJS_TABS, SELECTION_STATUS, STATUS_VARIANTS, UI_TEXT } from '@core/constants';

/**
 * Formats a number as currency.
 * @param {number} amount - The amount to format
 * @returns {string} The formatted currency string
 */
const formatCurrency = (amount) => {
  return amount ? `¥${amount.toLocaleString()}` : '-';
};

/**
 * Screen for displaying the list of selection progress.
 * @returns {JSX.Element} The rendered screen component
 */
const SelectionProgressListScreen = () => {
  const { data, loading, error, refetch } = useFirestore(
    () => FirestoreDataService.fetchAllFMJS(),
    []
  );

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(FMJS_TABS.BASIC);

  /**
   * Handles item press to open details modal.
   * @param {SelectionProgress} item - The selected item data
   */
  const handlePress = (item) => {
    setSelectedItem(item);
    setActiveTab(FMJS_TABS.BASIC);
    setModalVisible(true);
  };

  /**
   * Renders a single row in the list.
   * @param {Object} params - Render params
   * @param {SelectionProgress} params.item - The item data
   * @returns {JSX.Element} The rendered row component
   */
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>JD: {item.jdNumber}</Text>
          <StatusBadge
            status={item.activeStatus}
            variant={item.activeStatus === SELECTION_STATUS.OPEN ? STATUS_VARIANTS.SUCCESS : STATUS_VARIANTS.NEUTRAL}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>フェーズ:</Text>
            <Text style={styles.value}>{item.activePhase}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>候補者ID:</Text>
            <Text style={styles.value}>{item.individualId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>企業ID:</Text>
            <Text style={styles.value}>{item.companyId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>更新日時:</Text>
            <Text style={styles.value}>{item.updateTime}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Renders the header row of the list.
   * @returns {JSX.Element} The rendered header component
   */
  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText]}>ID</Text>
      <Text style={[styles.cell, styles.headerText]}>Status</Text>
      <Text style={[styles.cell, styles.headerText]}>Phase</Text>
      <Text style={[styles.cell, styles.headerText]}>個人ID</Text>
      <Text style={[styles.cell, styles.headerText]}>法人ID</Text>
      <Text style={[styles.cell, styles.headerText]}>JD No</Text>
      <Text style={[styles.cell, styles.headerText]}>更新日時</Text>
    </View>
  );

  /**
   * Renders the survey section of the details.
   * @param {Object} surveyData - The survey data
   * @returns {JSX.Element} The rendered survey section
   */
  const renderSurveySection = (surveyData) => {
    if (!surveyData) return <Text>アンケートデータなし</Text>;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>アンケート回答</Text>
        {Object.entries(surveyData).map(([key, value]) => (
          <View key={key} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{key}:</Text>
            <Text style={styles.detailValue}>{String(value)}</Text>
          </View>
        ))}
      </View>
    );
  };

  /**
   * Renders a detail item for feedback.
   * @param {Object} detail - The feedback detail object
   * @returns {JSX.Element} The rendered detail component
   */
  const renderFeedbackDetail = (detail) => {
    if (!detail) return null;
    return (
      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackText}><Text style={styles.bold}>日付:</Text> {detail.date_日付}</Text>
        <Text style={styles.feedbackText}><Text style={styles.bold}>評価:</Text> {detail.evaluation_評価}</Text>
        <Text style={styles.feedbackText}><Text style={styles.bold}>FB:</Text> {detail.feedback_FB}</Text>
        <Text style={styles.feedbackText}><Text style={styles.bold}>メモ:</Text> {detail.memo_メモ}</Text>
      </View>
    );
  };

  /**
   * Renders the feedback section.
   * @param {SelectionProgress} item - The selection progress data instance
   * @returns {JSX.Element} The rendered feedback section
   */
  const renderFeedbackSection = (item) => {
    if (!item) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>選考フィードバック</Text>

        <Text style={styles.subTitle}>書類選考</Text>
        {renderFeedbackDetail(item.documentScreening)}

        <Text style={styles.subTitle}>1次面接</Text>
        {renderFeedbackDetail(item.firstInterview)}

        <Text style={styles.subTitle}>{UI_TEXT.SECOND_INTERVIEW}</Text>
        {renderFeedbackDetail(item.secondInterview)}

        <Text style={styles.subTitle}>最終面接</Text>
        {renderFeedbackDetail(item.finalInterview)}
      </View>
    );
  };

  /**
   * Renders the content of the selected tab.
   * @returns {JSX.Element} The rendered content
   */
  const renderTabContent = () => {
    if (!selectedItem) return null;

    switch (activeTab) {
      case FMJS_TABS.BASIC:
        return (
          <ScrollView>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>基本情報</Text>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>JobStatID:</Text><Text style={styles.detailValue}>{selectedItem.JobStatID || selectedItem.id}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>個人ID:</Text><Text style={styles.detailValue}>{selectedItem.individualId}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>法人ID:</Text><Text style={styles.detailValue}>{selectedItem.companyId}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>JD Number:</Text><Text style={styles.detailValue}>{selectedItem.jdNumber}</Text></View>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>選考ステータス</Text>
              <SelectionFlowEditor
                initialData={selectedItem.progress}
                onSave={(newPhases) => console.log("Saved phases:", newPhases)}
              />
            </View>
          </ScrollView>
        );
      case FMJS_TABS.FEEDBACK:
        return (
          <ScrollView>
            {renderFeedbackSection(selectedItem)}
          </ScrollView>
        );
      case FMJS_TABS.SURVEY:
        return (
          <ScrollView>
            {renderSurveySection(selectedItem.survey)}
          </ScrollView>
        );
      case FMJS_TABS.FEE:
        return (
          <ScrollView>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>紹介料管理</Text>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>想定年収:</Text><Text style={styles.detailValue}>{formatCurrency(selectedItem.estimatedAnnualSalary)}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>料率:</Text><Text style={styles.detailValue}>{selectedItem.feeRate}%</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>請求金額:</Text><Text style={styles.detailValue}>{formatCurrency(selectedItem.billingAmount)}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>入金日:</Text><Text style={styles.detailValue}>{selectedItem.paymentDate || '-'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>返金規定:</Text><Text style={styles.detailValue}>{selectedItem.refundPolicy || '-'}</Text></View>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="選考進捗一覧 (FMJS)" showBack={false} />

      {error ? (
        <ErrorState message="データの読み込みに失敗しました" onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.JobStatID || item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={loading ? null : <EmptyState message="選考進捗データがありません" />}
          contentContainerStyle={styles.listContent}
          stickyHeaderIndices={[0]}
          refreshing={loading}
          onRefresh={refetch}
        />
      )}

      <DetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`詳細: ${selectedItem?.JobStatID || selectedItem?.id}`}
        width="90%"
        height="85%"
      >
        <View style={{ flex: 1 }}>
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === FMJS_TABS.BASIC && styles.activeTabItem]}
              onPress={() => setActiveTab(FMJS_TABS.BASIC)}
            >
              <Text style={[styles.tabText, activeTab === FMJS_TABS.BASIC && styles.activeTabText]}>{UI_TEXT.BASIC_INFO}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === FMJS_TABS.PROGRESS && styles.activeTabItem]}
              onPress={() => setActiveTab(FMJS_TABS.PROGRESS)}
            >
              <Text style={[styles.tabText, activeTab === FMJS_TABS.PROGRESS && styles.activeTabText]}>{UI_TEXT.SELECTION_PROGRESS}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === FMJS_TABS.FEE && styles.activeTabItem]}
              onPress={() => setActiveTab(FMJS_TABS.FEE)}
            >
              <Text style={[styles.tabText, activeTab === FMJS_TABS.FEE && styles.activeTabText]}>{UI_TEXT.FEE}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === FMJS_TABS.SURVEY && styles.activeTabItem]}
              onPress={() => setActiveTab(FMJS_TABS.SURVEY)}
            >
              <Text style={[styles.tabText, activeTab === FMJS_TABS.SURVEY && styles.activeTabText]}>{UI_TEXT.SURVEY}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {renderTabContent()}
          </View>
        </View>
      </DetailModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  cell: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  cellContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  // Modal Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: THEME.primary || '#007bff',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: THEME.primary || '#007bff',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#fff',
  },
  detailSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
    color: '#222',
  },
  // Feedback Styles
  feedbackContainer: {
    backgroundColor: '#fcfcfc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  feedbackHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  feedbackPhase: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  phaseTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textDecorationLine: 'underline',
  },
  feedbackSubSection: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#eee',
  },
  feedbackTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  // Survey Styles
  surveyPeriod: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary || '#007bff',
  },
  surveyPeriodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: THEME.primary || '#007bff',
  },
  surveyCategory: {
    marginBottom: 12,
  },
  surveyCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#444',
  },
  surveyQuestion: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 6,
  },
  questionText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007bff',
  },
});

export default SelectionProgressListScreen;