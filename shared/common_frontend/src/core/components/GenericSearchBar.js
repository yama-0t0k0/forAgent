import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../theme/theme';

/**
 * @typedef {Object} FilterOption
 * @property {string|number} value
 * @property {string} label
 */

/**
 * @typedef {Object} GenericSearchBarProps
 * @property {string} searchQuery - Current search query
 * @property {function(string): void} setSearchQuery - Callback to update search query
 * @property {string} [placeholder] - Placeholder text
 * @property {FilterOption[]} [quickFilters] - Array of filter options
 * @property {string|number} [activeFilter] - Currently active filter value
 * @property {function(string|number): void} [onApplyFilter] - Callback when filter is selected
 * @property {Object} [style] - Container style
 * @property {Object} [inputStyle] - Input field style
 * @property {Object} [filterContainerStyle] - Filter container style
 */

/**
 * Generic Search Bar Component with optional quick filters.
 * 
 * @param {GenericSearchBarProps} props
 */
export const GenericSearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  placeholder, 
  quickFilters = [], 
  activeFilter,
  onApplyFilter,
  style,
  inputStyle,
  filterContainerStyle
}) => (
  <View style={[styles.container, style]}>
    <TextInput
      style={[styles.input, inputStyle]}
      placeholder={placeholder}
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholderTextColor="#94A3B8"
    />
    {quickFilters.length > 0 && (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={[styles.filterContainer, filterContainerStyle]}
        contentContainerStyle={styles.filterContentContainer}
      >
        {quickFilters.map((filter, index) => {
          const isActive = activeFilter === filter.value;
          return (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.filterChip, 
                isActive && styles.activeFilterChip
              ]}
              onPress={() => onApplyFilter(filter.value)}
            >
              <Text style={[
                styles.filterText,
                isActive && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: '#1E293B',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterContentContainer: {
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeFilterChip: {
    backgroundColor: THEME?.primary || '#0EA5E9',
    borderColor: THEME?.primary || '#0EA5E9',
  },
  filterText: {
    fontSize: 12,
    color: '#475569',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
