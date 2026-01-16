import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DataContext } from '../state/DataContext';
import { THEME } from '../theme/theme';
import { SKILL_LEVELS, SKILL_LEVEL_TEXTS } from '../constants/index';

export const SkillSelector = ({ value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  // Determine current level from the value object { "LevelText": true }
  let currentLevel = 0; // Default to 0
  if (value && typeof value === 'object') {
    // Check keys, ignoring metadata like '_displayType'
    const entry = Object.entries(value).find(([key, val]) =>
      key !== '_displayType' && val === true && SKILL_LEVEL_TEXTS.includes(key)
    );
    if (entry) {
      const levelNum = Object.keys(SKILL_LEVELS).find(num => SKILL_LEVELS[num] === entry[0]);
      if (levelNum !== undefined) currentLevel = parseInt(levelNum, 10);
    }
  }

  const handleSelect = (level) => {
    const text = SKILL_LEVELS[level];
    // Create new object with selected level set to true, preserving metadata
    const newValue = { [text]: true };
    // Preserve _displayType if it exists
    if (value && value._displayType) {
      newValue._displayType = value._displayType;
    }
    updateValue(path, newValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {[0, 1, 2, 3, 4].map((level) => (
          <TouchableOpacity
            key={level}
            onPress={() => handleSelect(level)}
            style={[
              styles.levelButton,
              { backgroundColor: currentLevel === level ? THEME.accent : '#E2E8F0' }
            ]}
          >
            <Text style={{ color: currentLevel === level ? '#FFF' : THEME.text, fontWeight: 'bold' }}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>{SKILL_LEVELS[currentLevel]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionBox: { backgroundColor: THEME.inputBg, padding: 8, borderRadius: 6 },
  descriptionText: { color: THEME.text, fontSize: 12 },
});
