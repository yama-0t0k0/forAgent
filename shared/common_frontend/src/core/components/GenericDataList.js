import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';

export const GenericDataList = ({ 
  data, 
  renderItem, 
  keyExtractor, 
  ListEmptyComponent,
  contentContainerStyle,
  ...props 
}) => {
  const defaultKeyExtractor = (item) => item.id || item.JobStatID || Math.random().toString();
  
  const defaultEmptyComponent = (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>データがありません</Text>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor || defaultKeyExtractor}
      contentContainerStyle={[styles.listContainer, contentContainerStyle]}
      ListEmptyComponent={ListEmptyComponent || defaultEmptyComponent}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
