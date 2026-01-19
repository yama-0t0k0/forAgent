import React from 'react';
import { View } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { DataContext } from '@shared/src/core/state/DataContext';
import { styles } from '../../dashboardStyles';
import { ActivityIndicator } from 'react-native';

export const IndividualTab = ({
  searchQuery,
  setSearchQuery,
  filteredUsers,
  extractSkills,
  getHighDensityHeatmapData,
  onUserPress
}) => {
  const { data } = React.useContext(DataContext);
  const [scoredUsers, setScoredUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchScores = async () => {
      if (!filteredUsers || filteredUsers.length === 0) {
        setScoredUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Match against the first JD in context as a baseline for Admin view
        const targetJd = data?.jd?.[0] || {};
        const ranked = await MatchingService.rankCandidates(targetJd, filteredUsers, 'individual');
        setScoredUsers(ranked);
      } catch (err) {
        console.error('Failed to fetch scores for IndividualTab:', err);
        setScoredUsers(filteredUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [filteredUsers, data?.jd]);

  return (
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
      {loading && <ActivityIndicator size="small" color="#2196F3" style={{ marginBottom: 10 }} />}
      <GenericDataList
        data={scoredUsers}
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
};
