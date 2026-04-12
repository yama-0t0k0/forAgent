import React from 'react';
import { View, Text } from 'react-native';
import { GenericSearchBar } from '@shared/src/core/components/GenericSearchBar';
import { GenericDataList } from '@shared/src/core/components/GenericDataList';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { styles } from '@features/dashboard/dashboardStyles';
import { THEME } from '@shared/src/core/theme/theme';

export const IndividualTab = ({
  searchQuery,
  setSearchQuery,
  filteredUsers,
  extractSkills,
  getHighDensityHeatmapData,
  onUserPress,
  onGlobalSearch
}) => {
  const isEmailQuery = searchQuery.includes('@');

  /**
   * @returns {React.JSX.Element}
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery ? `'${searchQuery}' に一致するユーザーはいません` : 'データがありません'}
      </Text>
      {isEmailQuery && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.emptyText, { marginBottom: 12, fontSize: 14 }]}>
            登録済みの全ユーザーからメールアドレスで検索しますか？
          </Text>
          <GenericSearchBar
            // Re-using GenericSearchBar's styling or just a button
            placeholder='メールアドレスで検索'
            searchQuery={searchQuery}
            setSearchQuery={() => {}} // Read-only in this context
            hideFilters={true}
          />
          <View style={{ marginTop: 10, alignItems: 'center' }}>
             <Text 
               style={{ color: THEME.primary, fontWeight: 'bold', padding: 10 }}
               onPress={() => onGlobalSearch(searchQuery)}
             >
               🔍 サービス全体から検索を実行
             </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.tabContent}>
      <GenericSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder='名前、住所、学校名、IDなどで検索'
        quickFilters={[
          { label: '今月登録', value: 'this_month' },
          { label: 'エンジニア', value: 'engineer' }
        ]}
        onApplyFilter={(val) => console.log('Filter:', val)}
        style={styles.searchContainer}
      />

      <GenericDataList
        data={filteredUsers}
        ListEmptyComponent={renderEmpty()}
        renderItem={({ item }) => {
          const rawItem = item.rawData || item;
          const skills = extractSkills(item);
          const heatmapInfo = getHighDensityHeatmapData(rawItem);

          return (
            <EngineerListItem
              engineer={item}
              skills={skills}
              heatmapData={heatmapInfo}
              onPress={() => onUserPress(item)}
              testID='engineer_item'
              showMatchScore={false}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};
