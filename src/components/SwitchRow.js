import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { DataContext } from '../context/DataContext';
import { THEME } from '../constants/theme';

export const SwitchRow = ({ label, value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  return (
    <View style={styles.switchContainer}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        trackColor={{ false: '#CBD5E1', true: THEME.accent }}
        thumbColor={'#FFFFFF'}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  label: {
    fontSize: 14,
    color: THEME.subText,
    marginBottom: 6,
    fontWeight: '500',
  },
});
