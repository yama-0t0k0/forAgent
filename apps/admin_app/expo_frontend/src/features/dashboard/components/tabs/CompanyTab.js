import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { CompanyListItem } from '@shared/src/features/company/components/CompanyListItem';
import { IssueInvitationModal } from '../modals/IssueInvitationModal';
import { styles } from '@features/dashboard/dashboardStyles';
import { THEME } from '@shared/src/core/theme/theme';
import { TouchableOpacity } from 'react-native';

/**
 * Tab component for displaying and filtering the list of companies.
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query string.
 * @param {Function} props.setSearchQuery - State setter for search query.
 * @param {Array<Object>} props.filteredCompanies - List of filtered company data.
 * @returns {JSX.Element} The rendered component.
 */
export const CompanyTab = ({ searchQuery, setSearchQuery, filteredCompanies }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = React.useState(false);

  /**
   * Handles the press event on a company item.
   * @param {Object} item - The company data item.
   */
  const handlePress = (item) => {
    // Navigate to CompanyDetail passing the company data
    navigation.push('CompanyDetail', { companyData: item });
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>登録企業一覧</Text>
        <TouchableOpacity 
          style={styles.displayBadge} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.displayBadgeText}>+ 法人招待・権限付与</Text>
        </TouchableOpacity>
      </View>

      <GenericSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder='会社名、IDで検索'
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
          <CompanyListItem
            item={item}
            onPress={() => navigation.push('CompanyDetail', { companyId: item.id, initialData: item })}
            testID='company_item'
          />
        )}
        contentContainerStyle={styles.listContainer}
      />

      <IssueInvitationModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
};

