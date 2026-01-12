import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { DataContext } from '../context/DataContext';
import { THEME } from '../constants/theme';

export const SliderRow = ({ label, valueObj, path }) => {
  const context = useContext(DataContext);
  const { updateValue } = context || {};

  const { value, min = 0, max = 100, step = 1, unit = '' } = valueObj;

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSlidingComplete = (val) => {
    if (!updateValue) return;
    const newValueObj = { ...valueObj, value: val };
    updateValue(path, newValueObj);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>{localValue}{unit}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={localValue}
        onValueChange={setLocalValue}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={THEME.accent}
        maximumTrackTintColor="#CBD5E1"
        thumbTintColor={THEME.accent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: THEME.subText,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '600',
  },
});
