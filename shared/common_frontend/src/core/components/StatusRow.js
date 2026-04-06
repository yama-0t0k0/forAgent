import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} StatusRowProps
 * @property {string} label - Label for the status row
 * @property {Object} valueObj - Value object containing boolean status
 * @property {boolean} valueObj.value - True if registered, false otherwise
 */

/**
 * Displays a status row with a label and a success/neutral badge.
 * 
 * @param {StatusRowProps} props
 * @param {string} props.label - Label for the status row
 * @param {Object} props.valueObj - Value object containing boolean status
 */
export const StatusRow = ({ label, valueObj }) => {
  const isRegistered = valueObj?.value === true;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.badge, isRegistered ? styles.badgeSuccess : styles.badgeNeutral]}>
        <Text style={[styles.badgeText, isRegistered ? styles.textSuccess : styles.textNeutral]}>
          {isRegistered ? '登録済' : '未登録'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight, // Using borderLight instead of cardBorder
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...THEME.typography.bodySmall,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: THEME.spacing.sm + 2, // 10px equivalent
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: THEME.surfaceSuccess,
    borderColor: THEME.success,
  },
  badgeNeutral: {
    backgroundColor: THEME.surfaceNeutral,
    borderColor: THEME.borderNeutral,
  },
  badgeText: {
    ...THEME.typography.small,
    fontWeight: '600',
  },
  textSuccess: { color: THEME.textSuccess },
  textNeutral: { color: THEME.textNeutral },
});
