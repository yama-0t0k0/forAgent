import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} MonthYearPickerInputProps
 * @property {string} label - Label for the input
 * @property {Object} valueObj - Value object containing YYYYMM number
 * @property {number} valueObj.value - YYYYMM format (e.g. 202001)
 * @property {string} path - Data path for context update
 */

/**
 * Month and Year Picker Input Component.
 * Uses DataContext to update values.
 * 
 * @param {MonthYearPickerInputProps} props
 */
export const MonthYearPickerInput = ({ label, valueObj, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  const [show, setShow] = useState(false);

  // Parse YYYYMM (number)
  const yyyymm = valueObj?.value || 202001;
  const safeYyyymm = typeof yyyymm === 'number' ? yyyymm : 202001;

  const year = Math.floor(safeYyyymm / 100);
  const month = (safeYyyymm % 100) - 1; // 0-indexed
  const safeYear = year > 1900 && year < 2100 ? year : 2020;
  const safeMonth = month >= 0 && month < 12 ? month : 0;

  const dateValue = new Date(safeYear, safeMonth, 1);

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
      const newVal = y * 100 + m;
      const newValueObj = { ...valueObj, value: newVal };
      updateValue(path, newValueObj);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={() => setShow(true)} style={[styles.textInput, { justifyContent: 'center' }]}>
        <Text style={{ color: THEME.text }}>
          {`${safeYear}年 ${safeMonth + 1}月`}
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
