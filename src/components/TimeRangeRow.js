import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME } from '../constants/theme';
import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

export const TimeRangeRow = ({ label, valueObj, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const startTime = valueObj.start ? new Date(`2000-01-01T${valueObj.start}:00`) : new Date();
  const endTime = valueObj.end ? new Date(`2000-01-01T${valueObj.end}:00`) : new Date();

  const handleTimeChange = (type, event, selectedDate) => {
    // On Android, the picker closes automatically, so we set show to false.
    // On iOS, we keep it open to allow multiple changes until "Done" is pressed.
    if (Platform.OS === 'android') {
      if (type === 'start') setShowStartPicker(false);
      if (type === 'end') setShowEndPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const newValue = { ...valueObj, [type]: timeString };
      updateValue(path, newValue);
    }
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return "--:--";
    return timeStr;
  }

  const renderDoneButton = (type) => {
    if (Platform.OS !== 'ios') return null;
    return (
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => {
          if (type === 'start') setShowStartPicker(false);
          if (type === 'end') setShowEndPicker(false);
        }}
      >
        <Text style={styles.doneButtonText}>完了</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rowContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.subLabel}>開始</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              setShowStartPicker(!showStartPicker);
              setShowEndPicker(false);
            }}
          >
            <Text style={styles.timeText}>{formatTimeDisplay(valueObj.start)}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.separator}>～</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.subLabel}>終了</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              setShowEndPicker(!showEndPicker);
              setShowStartPicker(false);
            }}
          >
            <Text style={styles.timeText}>{formatTimeDisplay(valueObj.end)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <View>
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(e, d) => handleTimeChange('start', e, d)}
            textColor={THEME.text}
          />
          {renderDoneButton('start')}
        </View>
      )}

      {showEndPicker && (
        <View>
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(e, d) => handleTimeChange('end', e, d)}
            textColor={THEME.text}
          />
          {renderDoneButton('end')}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 14,
    color: THEME.subText,
    marginBottom: 8,
    fontWeight: '500',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  separator: {
    fontSize: 16,
    color: THEME.subText,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    color: THEME.subText,
    marginBottom: 4,
  },
  timeButton: {
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 16,
    color: THEME.text,
  },
  doneButton: {
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#F0F0F0',
    marginTop: 5,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: THEME.accent,
    fontWeight: '600',
  },
});
