import React from 'react';
import { View } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { JobListItem } from '@shared/src/features/job/components/JobListItem';
import { styles } from '../../dashboardStyles';

export const JobTab = ({ 
  searchQuery, 
  setSearchQuery, 
  filteredJobs, 
  extractSkills, 
  getHighDensityHeatmapData, 
  getCompanyName, 
  onJobPress 
}) => (
  <View style={styles.tabContent}>
    <GenericSearchBar 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
      placeholder="職種、JD番号で検索"
      quickFilters={[
        { label: '募集中', value: 'open' },
        { label: '急募', value: 'urgent' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
      style={styles.searchContainer}
    />
    <GenericDataList 
      data={filteredJobs}
      renderItem={({ item }) => {
        // Normalize skill data for jobs (assuming 'スキル要件' or same structure as user)
        const rawItem = item.rawData || item;
        const jobDataForSkills = rawItem['スキル要件'] ? { 'スキル経験': rawItem['スキル要件'] } : rawItem;
        
        const skills = extractSkills(jobDataForSkills);
        const companyName = getCompanyName(item.companyId || item.company_ID); // Handle model prop
        const heatmapInfo = getHighDensityHeatmapData(jobDataForSkills);

        return (
          <JobListItem 
            job={item}
            skills={skills}
            heatmapData={heatmapInfo}
            companyName={companyName}
            onPress={() => onJobPress(item)}
            testID="job_item"
          />
        );
      }}
      contentContainerStyle={styles.listContainer}
    />
  </View>
);
