import React from 'react';
import { View, Text } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { styles } from '../../dashboardStyles';

export const CompanyTab = ({ searchQuery, setSearchQuery, filteredCompanies }) => (
  <View style={styles.tabContent}>
    <GenericSearchBar 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
      placeholder="会社名、IDで検索"
      quickFilters={[
        { label: '契約中', value: 'active' },
        { label: '今月契約', value: 'new' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
      style={styles.searchContainer}
    />
    <GenericDataList 
      data={filteredCompanies}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.itemTitle}>{item.companyName || item.name || '名称未設定'}</Text>
          <Text style={styles.itemSubtitle}>ID: {item.id}</Text>
          <Text style={styles.itemDetail}>{item.address || '-'}</Text>
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);

