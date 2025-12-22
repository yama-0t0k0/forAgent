import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DataContext } from '../state/DataContext';
import { THEME } from '../theme/theme';

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
