import React from 'react';
import { View } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { styles } from '../../dashboardStyles';

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
        const skills = extractSkills(item);
        const heatmapInfo = getHighDensityHeatmapData(item);

        return (
          <EngineerListItem 
            engineer={item}
            skills={skills}
            heatmapData={heatmapInfo}
            onPress={() => onUserPress(item)}
          />
        );
      }}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);
