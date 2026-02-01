import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} SingleSelectGroupProps
 * @property {Object} value - Current value object (keys are options)
 * @property {string[]} path - Data path for context update
 */

/**
 * Single Select Group Component.
 * Acts like a radio button group where only one option can be true.
 * Includes complex logic for '現職種' exclusive selection across nested levels.
 * 
 * @param {SingleSelectGroupProps} props
 * @param {Object} props.value - Current value object (keys are options)
 * @param {string[]} props.path - Data path for context update
 */
export const SingleSelectGroup = ({ value, path }) => {
  const { data, updateValue } = useContext(DataContext);

  /**
   * Handles toggle interaction.
   * @param {string} key - The option key to toggle.
   */
  const handleToggle = (key) => {
    // Check if we are inside '現職種' to apply specific exclusive logic
    const rootKeyIndex = path.indexOf('現職種');

    if (rootKeyIndex !== -1) {
      // Scope update to the '現職種' root
      const rootPath = path.slice(0, rootKeyIndex + 1);

      /**
       * Gets data at the specified path.
       * @param {Object} obj - Source object.
       * @param {string[]} p - Path array.
       * @returns {any} Value at path.
       */
      const getAt = (obj, p) => p.reduce((o, k) => (o && o[k] ? o[k] : null), obj);
      const rootData = getAt(data, rootPath);

      if (!rootData) {
        console.warn('Root data not found for path:', rootPath);
        return;
      }

      // Deep copy the root data
      const newRootData = JSON.parse(JSON.stringify(rootData));

      const currentTargetVal = !!value[key];
      const nextVal = !currentTargetVal;

      if (nextVal) {
        // --- Toggling ON ---

        // 1. Identify the target job object within newRootData
        const relativePath = path.slice(rootKeyIndex + 1);
        let targetJobObj = newRootData;
        for (const p of relativePath) {
          targetJobObj = targetJobObj[p];
        }

        if (targetJobObj) {
          // 2. Local Reset: Turn off ALL booleans in this job object first
          Object.keys(targetJobObj).forEach(k => {
            if (typeof targetJobObj[k] === 'boolean') {
              targetJobObj[k] = false;
            }
          });

          // 3. Global Reset: Turn off the SAME key (e.g., 'sub1') in ALL other jobs (entire '現職種' tree)
          /**
           * Recursively resets the target key in the object tree.
           * @param {Object} obj - The object to traverse.
           * @param {string} targetKey - The key to reset.
           */
          const resetKeyGlobal = (obj, targetKey) => {
            if (obj && typeof obj === 'object') {
              Object.keys(obj).forEach(k => {
                if (k === targetKey && typeof obj[k] === 'boolean') {
                  obj[k] = false;
                } else {
                  resetKeyGlobal(obj[k], targetKey);
                }
              });
            }
          };
          resetKeyGlobal(newRootData, key);

          // 4. Set the target to true
          targetJobObj[key] = true;
        }

      } else {
        // --- Toggling OFF ---
        const relativePath = path.slice(rootKeyIndex + 1);
        let targetJobObj = newRootData;
        for (const p of relativePath) {
          targetJobObj = targetJobObj[p];
        }
        if (targetJobObj) {
          targetJobObj[key] = false;
        }
      }

      updateValue(rootPath, newRootData);

    } else {
      // Fallback for local exclusive group behavior (radio button style)
      const newObject = { ...value };
      const currentVal = !!newObject[key];
      const nextVal = !currentVal;

      if (nextVal) {
        Object.keys(newObject).forEach(k => {
          if (k !== '_displayType' && typeof newObject[k] === 'boolean') {
            newObject[k] = (k === key);
          }
        });
      } else {
        newObject[key] = false;
      }
      updateValue(path, newObject);
    }
  };

  return (
    <View>
      {Object.keys(value).map(key => {
        if (key === '_displayType') return null;
        if (typeof value[key] !== 'boolean') return null;

        return (
          <View key={key} style={styles.switchContainer}>
            <Text style={styles.label}>{key}</Text>
            <Switch
              trackColor={{ false: THEME.cardBorder, true: THEME.accent }}
              thumbColor={'#FFFFFF'}
              onValueChange={() => handleToggle(key)}
              value={!!value[key]}
            />
          </View>
        );
      })}
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
