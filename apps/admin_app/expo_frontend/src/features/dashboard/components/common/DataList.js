import React from 'react';
import { FlatList, Text } from 'react-native';
import { styles } from '../../dashboardStyles';

export const DataList = ({ data, renderItem }) => (
  <FlatList
    data={data}
    renderItem={renderItem}
    keyExtractor={(item) => item.id || item.JobStatID || Math.random().toString()}
    contentContainerStyle={styles.listContainer}
    ListEmptyComponent={<Text style={styles.emptyText}>データがありません</Text>}
  />
);
