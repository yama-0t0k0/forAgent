import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../../dashboardStyles';

export const SearchSection = ({ searchQuery, setSearchQuery, placeholder, quickFilters, onApplyFilter }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilterContainer}>
      {quickFilters.map((filter, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.quickFilterChip}
          onPress={() => onApplyFilter(filter.value)}
        >
          <Text style={styles.quickFilterText}>{filter.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);
