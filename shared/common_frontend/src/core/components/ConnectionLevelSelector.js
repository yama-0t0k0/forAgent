import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { CONNECTION_LEVELS, CONNECTION_LEVEL_TEXTS } from '@shared/src/core/constants/index';

/**
 * @typedef {Object} ConnectionLevelSelectorProps
 * @property {Object} value - Current value object (e.g. { "Interested": true })
 * @property {string[]} path - Data path for context update
 */

/**
 * Connection Level Selector Component.
 * Allows selecting a connection level (1, 2, 3).
 * 
 * @param {ConnectionLevelSelectorProps} props
 * @param {Object} props.value - Current value object (e.g. { "Interested": true })
 * @param {string[]} props.path - Data path for context update
 */
export const ConnectionLevelSelector = ({ value, path }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { updateValue } = context;

  // Determine current level
  let currentLevel = 0;
  if (value && typeof value === 'object') {
    /** @type {[string, any]} */
    const entry = Object.entries(value).find(([key, val]) =>
      key !== '_displayType' && val === true && CONNECTION_LEVEL_TEXTS.includes(key)
    );
    if (entry) {
      /** @type {string | undefined} */
      const levelNum = Object.keys(CONNECTION_LEVELS).find(num => CONNECTION_LEVELS[num] === entry[0]);
      if (levelNum !== undefined) currentLevel = parseInt(levelNum, 10);
    }
  }

  /**
   * Handles level selection.
   * @param {number} level - The selected level (1-3).
   */
  const handleSelect = (level) => {
    const text = CONNECTION_LEVELS[level];
    const newValue = { [text]: true };
    if (value && value._displayType) {
      newValue._displayType = value._displayType;
    }
    updateValue(path, newValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {[1, 2, 3].map((level) => (
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
        <Text style={styles.descriptionText}>{currentLevel > 0 ? CONNECTION_LEVELS[currentLevel] : '未選択'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, marginBottom: 8 },
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
