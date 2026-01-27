import React from 'react';
import { View, Text } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { styles } from '../../dashboardStyles';

/**
 * Tab component for displaying and filtering the selection process list.
 * @param {Object} props
 * @param {string} props.searchQuery - Current search query string.
 * @param {Function} props.setSearchQuery - State setter for search query.
 * @param {Array<Object>} props.filteredSelections - List of filtered selection data.
 * @returns {JSX.Element} The rendered component.
 */
export const SelectionTab = ({ searchQuery, setSearchQuery, filteredSelections }) => (
  <View style={styles.tabContent}>
    <GenericSearchBar
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="JobStatID、個人IDで検索"
      quickFilters={[
        { label: '選考中', value: 'active' },
        { label: '内定', value: 'offer' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
      style={styles.searchContainer}
    />
    <GenericDataList
      data={filteredSelections}
      renderItem={({ item }) => (
        <View style={styles.listItem} testID="selection_item">
          <Text style={styles.itemTitle}>JobStatID: {item.JobStatID}</Text>
          <Text style={styles.itemSubtitle}>個人: {item['選考進捗']?.['id_individual_個人ID']}</Text>
          <Text style={styles.itemDetail}>求人: {item['選考進捗']?.['JD_Number']}</Text>
          <Text style={styles.statusBadge}>
            {Object.keys(item['選考進捗']?.['status_ステータス'] || {}).filter(k => item['選考進捗']['status_ステータス'][k]).join(', ')}
          </Text>
        </View>
      )}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);

