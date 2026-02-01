import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} DatePickerInputProps
 * @property {string} label - Input label
 * @property {Object} valueObj - Value object containing YYYYMMDD number
 * @property {number} valueObj.value - YYYYMMDD format (e.g. 19900101)
 * @property {string} path - Data path for context update
 */

/**
 * Date Picker Input Component (YYYYMMDD).
 * Uses DataContext to update values.
 * 
 * @param {DatePickerInputProps} props
 */
export const DatePickerInput = ({ label, valueObj, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  const [show, setShow] = useState(false);

  // Parse YYYYMMDD (number)
  const yyyymmdd = valueObj?.value || 19900101;
  const safeYyyymmdd = typeof yyyymmdd === 'number' ? yyyymmdd : 19900101;

  const year = Math.floor(safeYyyymmdd / 10000);
  const month = Math.floor((safeYyyymmdd % 10000) / 100) - 1; // 0-indexed
  const day = safeYyyymmdd % 100;

  const safeYear = year > 1900 && year < 2100 ? year : 1990;
  const safeMonth = month >= 0 && month < 12 ? month : 0;
  const safeDay = day >= 1 && day <= 31 ? day : 1;

  const dateValue = new Date(safeYear, safeMonth, safeDay);

  /**
   * Handles date picker change.
   * @param {Object} event - The event object.
   * @param {Date} [selectedDate] - The selected date.
   */
  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate && event.type !== 'dismissed') {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth() + 1;
      const d = selectedDate.getDate();
      const newVal = y * 10000 + m * 100 + d;
      const newValueObj = { ...valueObj, value: newVal };
      updateValue(path, newValueObj);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} style={[styles.textInput, { justifyContent: 'center' }]}>
        <Text style={{ color: THEME.text }}>
          {`${safeYear}年 ${safeMonth + 1}月 ${safeDay}日`}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={onChange}
          locale="ja-JP"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: THEME.subText, marginBottom: 6, fontWeight: '500' },
  textInput: {
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
