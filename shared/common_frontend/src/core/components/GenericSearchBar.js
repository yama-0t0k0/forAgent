import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

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
      placeholderTextColor={THEME.textMuted}
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
    backgroundColor: THEME.surfaceInput,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md * 0.75, // 12px
    fontSize: THEME.typography.bodySmall.fontSize,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    color: THEME.textPrimary,
    marginBottom: THEME.spacing.md * 0.75, // 12px
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterContentContainer: {
    paddingRight: THEME.spacing.md,
  },
  filterChip: {
    backgroundColor: THEME.surfaceMuted,
    paddingHorizontal: THEME.spacing.sm + 4, // 12px
    paddingVertical: THEME.spacing.xs + 2, // 6px
    borderRadius: THEME.radius.pill,
    marginRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  activeFilterChip: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterText: {
    ...THEME.typography.small,
    color: THEME.textNeutral,
  },
  activeFilterText: {
    color: THEME.textInverse,
    fontWeight: 'bold',
  },
});
