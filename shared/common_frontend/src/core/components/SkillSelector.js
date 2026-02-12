import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { SKILL_LEVELS, SKILL_LEVEL_TEXTS, FIELD_META } from '@shared/src/core/constants/index';
import { DATA_TYPE } from '@shared/src/core/constants/system';

/**
 * @typedef {Object} SkillSelectorProps
 * @property {Object} value - Current value object (e.g. { "Beginner": true })
 * @property {string[]} path - Data path for context update
 */

/**
 * Skill Level Selector Component.
 * Allows selecting a skill level from 0 to 4.
 * 
 * @param {SkillSelectorProps} props
 * @param {Object} props.value - Current value object (e.g. { "Beginner": true })
 * @param {string[]} props.path - Data path for context update
 */
export const SkillSelector = ({ value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  // Determine current level from the value object { "LevelText": true }
  let currentLevel = 0; // Default to 0
  if (value && typeof value === DATA_TYPE.OBJECT) {
    // Check keys, ignoring metadata like '_displayType'
    /** @type {[string, any]} */
    const entry = Object.entries(value).find(([key, val]) =>
      key !== FIELD_META.DISPLAY_TYPE && val === true && SKILL_LEVEL_TEXTS.includes(key)
    );
    if (entry) {
      /** @type {string} */
      const levelNum = Object.keys(SKILL_LEVELS).find(num => SKILL_LEVELS[num] === entry[0]);
      if (levelNum !== undefined) currentLevel = parseInt(levelNum, 10);
    }
  }

  /**
   * Handles skill level selection.
   * @param {number} level - Selected level (0-4)
   */
  const handleSelect = (level) => {
    const text = SKILL_LEVELS[level];
    // Create new object with selected level set to true, preserving metadata
    const newValue = { [text]: true };
    // Preserve _displayType if it exists
    if (value && value[FIELD_META.DISPLAY_TYPE]) {
      newValue[FIELD_META.DISPLAY_TYPE] = value[FIELD_META.DISPLAY_TYPE];
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
