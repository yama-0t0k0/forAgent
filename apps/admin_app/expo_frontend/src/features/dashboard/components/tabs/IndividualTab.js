import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { styles } from '@features/dashboard/dashboardStyles';

export const IndividualTab = ({
  searchQuery,
  setSearchQuery,
  filteredUsers,
  extractSkills,
  getHighDensityHeatmapData,
  onUserPress
}) => (
  <View style={styles.tabContent}>
    <GenericSearchBar
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      placeholder="名前、住所、学校名、IDなどで検索"
      quickFilters={[
        { label: '今月登録', value: 'this_month' },
        { label: 'エンジニア', value: 'engineer' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
      style={styles.searchContainer}
    />
    <GenericDataList
      data={filteredUsers}
      renderItem={({ item }) => {
        // Handle both Model and raw object
        const rawItem = item.rawData || item;
        const skills = extractSkills(item); // extractSkills now handles User model
        const heatmapInfo = getHighDensityHeatmapData(rawItem);

        return (
          <EngineerListItem
            engineer={item}
            skills={skills}
            heatmapData={heatmapInfo}
            onPress={() => onUserPress(item)}
            testID="engineer_item"
            showMatchScore={false}
          />
        );
      }}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);
