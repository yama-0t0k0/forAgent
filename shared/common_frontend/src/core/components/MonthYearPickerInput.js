import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { PICKER_EVENT_TYPE, DATE_CONSTRAINTS } from '@shared/src/core/constants/field';
import { DATA_TYPE } from '@shared/src/core/constants/system';

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
 * @param {string} props.label - Label for the input
 * @param {Object} props.valueObj - Value object containing YYYYMM number
 * @param {string} props.path - Data path for context update
 */
export const MonthYearPickerInput = ({ label, valueObj, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  const [show, setShow] = useState(false);

  // Parse YYYYMM (number)
  const yyyymm = valueObj?.value || DATE_CONSTRAINTS.DEFAULT_YYYYMM;
  const safeYyyymm = typeof yyyymm === DATA_TYPE.NUMBER ? yyyymm : DATE_CONSTRAINTS.DEFAULT_YYYYMM;

  const year = Math.floor(safeYyyymm / 100);
  const month = (safeYyyymm % 100) - 1; // 0-indexed
  const safeYear = year > DATE_CONSTRAINTS.MIN_YEAR && year < DATE_CONSTRAINTS.MAX_YEAR ? year : DATE_CONSTRAINTS.DEFAULT_YEAR_MONTH;
  const safeMonth = month >= 0 && month < DATE_CONSTRAINTS.MONTHS_IN_YEAR ? month : 0;

  const dateValue = new Date(safeYear, safeMonth, 1);

  /**
   * Handles date picker change.
   * @param {Object} event - The event object.
   * @param {Date} [selectedDate] - The selected date.
   */
  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate && event.type !== PICKER_EVENT_TYPE.DISMISSED) {
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
        <Text style={{ color: THEME.textPrimary }}>
          {`${safeYear}年 ${safeMonth + 1}月`}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode='date'
          display='default'
          onChange={onChange}
          locale='ja-JP'
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { marginBottom: THEME.spacing.md },
  label: { 
    ...THEME.typography.caption, 
    color: THEME.textSecondary, 
    marginBottom: THEME.spacing.xs, 
    fontWeight: '500' 
  },
  textInput: {
    backgroundColor: THEME.surfaceVariant,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    fontSize: 16,
    color: THEME.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
