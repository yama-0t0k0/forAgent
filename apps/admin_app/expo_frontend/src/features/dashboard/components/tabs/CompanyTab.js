import React from 'react';
import { View, Text } from 'react-native';
import { SearchSection } from '../common/SearchSection';
import { DataList } from '../common/DataList';
import { styles } from '../../dashboardStyles';

export const CompanyTab = ({ searchQuery, setSearchQuery, filteredCompanies }) => (
  <View style={styles.tabContent}>
    <SearchSection 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
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
