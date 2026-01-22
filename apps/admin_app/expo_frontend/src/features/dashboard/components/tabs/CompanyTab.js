import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { CompanyListItem } from '@shared/src/features/company/components/CompanyListItem';
import { styles } from '../../dashboardStyles';

export const CompanyTab = ({ searchQuery, setSearchQuery, filteredCompanies }) => {
  const navigation = useNavigation();

  const handlePress = (item) => {
    // Navigate to CompanyDetail passing the company data
    navigation.push('CompanyDetail', { companyData: item });
  };

  return (
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
          <TouchableOpacity
            onPress={() => navigation.push('CompanyDetail', { companyId: item.id, initialData: item })}
            testID="company_item"
          >
            <CompanyListItem item={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

