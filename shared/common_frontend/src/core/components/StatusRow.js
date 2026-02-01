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
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: THEME.subText,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSuccess: { color: '#047857' },
  textNeutral: { color: '#475569' },
});
