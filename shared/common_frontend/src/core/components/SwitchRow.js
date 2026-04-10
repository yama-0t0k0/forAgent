import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} SwitchRowProps
 * @property {string} label - Label text
 * @property {boolean} value - Current switch value
 * @property {string[]} path - Data path for context update
 */

/**
 * Row component with a label and a toggle switch.
 * 
 * @param {SwitchRowProps} props
 * @param {string} props.label - Label text
 * @param {boolean} props.value - Current switch value
 * @param {string[]} props.path - Data path for context update
 */
export const SwitchRow = ({ label, value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  return (
    <View style={styles.switchContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        trackColor={{ false: THEME.borderDefault, true: THEME.primary }}
        thumbColor={THEME.textInverse}
        onValueChange={(newValue) => updateValue(path, newValue)}
        value={!!value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderDefault,
  },
  label: {
    ...THEME.typography.bodySmall,
    color: THEME.textSecondary,
    marginBottom: THEME.spacing.xs,
    fontWeight: '500',
  },
});
