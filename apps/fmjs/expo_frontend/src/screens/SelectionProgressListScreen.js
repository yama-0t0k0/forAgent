import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal, ScrollView, Button } from 'react-native';
import { db } from '@shared/src/core/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { THEME } from '@shared/src/core/theme/theme';

const getActiveKey = (obj) => {
  if (!obj) return '-';
  const entry = Object.entries(obj).find(([_, value]) => value === true);
  return entry ? entry[0] : '-';
};

const formatCurrency = (amount) => {
  return amount ? `¥${amount.toLocaleString()}` : '-';
};

const DUMMY_DATA = [
  {
    "JobStatID": "S202412310001",
    "UpdateTimestamp_yyyymmddtttttt": 20250114140837,
    "選考進捗": {
        "fase_フェイズ": { "1次面接": true, "2次面接": false, "その他選考": false, "オファー面談": false, "カジュアル面談": false, "入社_請求": false, "内定": false, "内定受諾": false, "応募_書類選考": false, "最終面接": false, "短期離職_返金": false, "退職日確定": false },
        "status_ステータス": { "選考中": true },
        "id_individual_個人ID": "IND001",
        "id_company_法人ID": "COMP001",
        "JD_Number": "JD001"
    },
    "手数料管理簿": {
        "手数料の額": 0,
        "手数料の算出根拠": { "Fee": 0.4, "理論年収": 6000000 }
    },
    "入社後サーベイ_PostJoiningSurvey": null
  },
  {
    "JobStatID": "S202412310002",
    "UpdateTimestamp_yyyymmddtttttt": 20250115100000,
    "選考進捗": {
        "fase_フェイズ": { "1次面接": false, "2次面接": false, "その他選考": false, "オファー面談": false, "カジュアル面談": false, "入社_請求": false, "内定": false, "内定受諾": true, "応募_書類選考": false, "最終面接": false, "短期離職_返金": false, "退職日確定": false },
        "status_ステータス": { "選考中": false, "内定": true },
        "id_individual_個人ID": "IND002",
        "id_company_法人ID": "COMP002",
        "JD_Number": "JD002"
    },
    "手数料管理簿": {
        "手数料の額": 2400000,
        "手数料の算出根拠": { "Fee": 0.4, "理論年収": 6000000 }
    },
    "入社後サーベイ_PostJoiningSurvey": null
  },
  {
    "JobStatID": "S202412310003",
    "UpdateTimestamp_yyyymmddtttttt": 20250116093000,
    "選考進捗": {
        "fase_フェイズ": { "1次面接": false, "2次面接": false, "その他選考": false, "オファー面談": false, "カジュアル面談": false, "入社_請求": true, "内定": false, "内定受諾": false, "応募_書類選考": false, "最終面接": false, "短期離職_返金": false, "退職日確定": false },
        "status_ステータス": { "選考中": false, "入社済み": true },
        "id_individual_個人ID": "IND003",
        "id_company_法人ID": "COMP003",
        "JD_Number": "JD003"
    },
    "手数料管理簿": {
        "手数料の額": 3000000,
        "手数料の算出根拠": { "Fee": 0.35, "理論年収": 8570000 }
    },
    "入社後サーベイ_PostJoiningSurvey": {
        "1ヶ月": {
            "A. 転職プロセスの満足度": {
                "1.転職のプロセス（求人紹介、面接対策など）に満足している。": { "5 とてもそう思う": true }
            }
        }
    }
  }
];

const SelectionProgressListScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'FeeMgmtAndJobStatDB'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // Combine Firestore data with dummy data
        const combinedData = [...list, ...DUMMY_DATA];
        
        // Remove duplicates if any (based on JobStatID)
        const uniqueData = Array.from(new Map(combinedData.map(item => [item.JobStatID || item.id, item])).values());
        
        setData(uniqueData);
      } catch (error) {
        console.error("Error fetching data: ", error);
        Alert.alert("Error", "Failed to fetch data.");
        // Fallback to dummy data on error
        setData(DUMMY_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    // Extract fields based on JSON structure
    const jobStatID = item.JobStatID || item.id;
    const progress = item['選考進捗'] || {};
    const phase = getActiveKey(progress['fase_フェイズ']);
    const status = getActiveKey(progress['status_ステータス']);
    const individualID = progress['id_individual_個人ID'] || '-';
    const companyID = progress['id_company_法人ID'] || '-';
    const jdNumber = progress['JD_Number'] || '-';
    const updateTime = item['UpdateTimestamp_yyyymmddtttttt'] || '-';

    return (
      <View style={styles.row}>
        <TouchableOpacity style={styles.cellContainer} onPress={() => handlePress(item)}>
          <Text style={[styles.cell, styles.link]} numberOfLines={1} ellipsizeMode="tail">{jobStatID}</Text>
        </TouchableOpacity>
        
        <View style={styles.cellContainer}>
            <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
        </View>

        <View style={styles.cellContainer}>
            <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{phase}</Text>
        </View>

        <TouchableOpacity style={styles.cellContainer} onPress={() => Alert.alert("個人ID", individualID)}>
          <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{individualID}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cellContainer} onPress={() => Alert.alert("法人ID", companyID)}>
          <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{companyID}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cellContainer} onPress={() => Alert.alert("求人票No", jdNumber)}>
          <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{jdNumber}</Text>
        </TouchableOpacity>

        <View style={styles.cellContainer}>
            <Text style={styles.cell} numberOfLines={1} ellipsizeMode="tail">{updateTime}</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText]}>マッチングID</Text>
      <Text style={[styles.cell, styles.headerText]}>ステータス</Text>
      <Text style={[styles.cell, styles.headerText]}>フェーズ</Text>
      <Text style={[styles.cell, styles.headerText]}>求職者名</Text>
      <Text style={[styles.cell, styles.headerText]}>求人企業</Text>
      <Text style={[styles.cell, styles.headerText]}>求人票No</Text>
      <Text style={[styles.cell, styles.headerText]}>更新日時</Text>
    </View>
  );

  const renderSurveySection = (surveyData) => {
    if (!surveyData) return <Text style={styles.detailText}>No survey data.</Text>;
    
    return Object.entries(surveyData).map(([period, categories]) => (
      <View key={period} style={styles.surveyPeriod}>
        <Text style={styles.surveyPeriodTitle}>{period}</Text>
        {Object.entries(categories).map(([category, questions]) => {
            if (typeof questions !== 'object') return null; // Handle potential non-object values like simple scores
            return (
                <View key={category} style={styles.surveyCategory}>
                    <Text style={styles.surveyCategoryTitle}>{category}</Text>
                    {Object.entries(questions).map(([question, answers]) => {
                        let answerText = "";
                        if (typeof answers === 'object') {
                            answerText = getActiveKey(answers);
                        } else {
                            answerText = String(answers);
                        }
                        return (
                            <View key={question} style={styles.surveyQuestion}>
                                <Text style={styles.questionText}>{question}</Text>
                                <Text style={styles.answerText}>Answer: {answerText}</Text>
                            </View>
                        );
                    })}
                </View>
            );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>選考進捗一覧 (FMJS)</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.JobStatID || item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>No data found.</Text>}
        contentContainerStyle={styles.listContent}
        stickyHeaderIndices={[0]}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>詳細: {selectedItem?.JobStatID || selectedItem?.id}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
                {selectedItem && (
                    <>
                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>基本情報</Text>
                            <Text style={styles.detailText}>求職者ID: {selectedItem['選考進捗']?.id_individual_個人ID}</Text>
                            <Text style={styles.detailText}>求人企業ID: {selectedItem['選考進捗']?.id_company_法人ID}</Text>
                            <Text style={styles.detailText}>求人票No: {selectedItem['選考進捗']?.JD_Number}</Text>
                            <Text style={styles.detailText}>更新日時: {selectedItem['UpdateTimestamp_yyyymmddtttttt']}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>選考進捗</Text>
                            <Text style={styles.detailText}>ステータス: {getActiveKey(selectedItem['選考進捗']?.status_ステータス)}</Text>
                            <Text style={styles.detailText}>フェーズ: {getActiveKey(selectedItem['選考進捗']?.fase_フェイズ)}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>手数料管理</Text>
                            <Text style={styles.detailText}>手数料額: {formatCurrency(selectedItem['手数料管理簿']?.['手数料の額'])}</Text>
                            <Text style={styles.detailText}>料率: {selectedItem['手数料管理簿']?.['手数料の算出根拠']?.['Fee'] ? `${(selectedItem['手数料管理簿']['手数料の算出根拠']['Fee'] * 100).toFixed(0)}%` : '-'}</Text>
                            <Text style={styles.detailText}>理論年収: {formatCurrency(selectedItem['手数料管理簿']?.['手数料の算出根拠']?.['理論年収'])}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.sectionTitle}>入社後サーベイ</Text>
                            {renderSurveySection(selectedItem['入社後サーベイ_PostJoiningSurvey'])}
                        </View>
                    </>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  cellContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
  // Survey Styles
  surveyPeriod: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary || '#007bff',
  },
  surveyPeriodTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    color: THEME.primary || '#007bff',
  },
  surveyCategory: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  surveyCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#555',
  },
  surveyQuestion: {
    marginBottom: 6,
    paddingLeft: 8,
  },
  questionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  answerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222',
  },
});

export default SelectionProgressListScreen;