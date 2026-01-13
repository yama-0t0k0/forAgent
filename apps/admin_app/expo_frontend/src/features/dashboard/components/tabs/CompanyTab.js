import React from 'react';
import { View, Text } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { CompanyListItem } from '@shared/src/features/company/components/CompanyListItem';
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
        <CompanyListItem item={item} />
      )}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);

