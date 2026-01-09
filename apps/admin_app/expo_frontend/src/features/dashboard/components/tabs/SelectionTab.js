import React from 'react';
import { View, Text } from 'react-native';
import { SearchSection } from '../common/SearchSection';
import { DataList } from '../common/DataList';
import { styles } from '../../dashboardStyles';

export const SelectionTab = ({ searchQuery, setSearchQuery, filteredSelections }) => (
  <View style={styles.tabContent}>
    <SearchSection 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
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
