import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { SKILL_LEVEL_TEXTS } from '@shared/src/core/constants/index';
import { DataContext } from '@shared/src/core/state/DataContext';
import { FIELD_META, FIELD_DISPLAY_TYPE } from '@shared/src/core/constants/field';

import { InputRow } from '@shared/src/core/components/InputRow';
import { SwitchRow } from '@shared/src/core/components/SwitchRow';
import { SkillSelector } from '@shared/src/core/components/SkillSelector';
import { ConnectionLevelSelector } from '@shared/src/core/components/ConnectionLevelSelector';
import { MonthYearPickerInput } from '@shared/src/core/components/MonthYearPickerInput';
import { DatePickerInput } from '@shared/src/core/components/DatePickerInput';
import { SingleSelectGroup } from '@shared/src/core/components/SingleSelectGroup';
import { StatusRow } from '@shared/src/core/components/StatusRow';

/**
 * An item component for the accordion view.
 * @param {Object} props - The component props.
 * @param {string} props.label - The label for the accordion item.
 * @param {Object} props.data - The data to display in the accordion item.
 * @param {number} props.depth - The nesting depth of the item.
 * @param {Array<string>} props.path - The path to the data in the object.
 * @returns {JSX.Element} The accordion item.
 */
const AccordionItem = ({ label, data, depth, path }) => {
  const [expanded, setExpanded] = useState(depth === 0);

  /**
   * Toggles the expanded state of the accordion item.
   */
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isEmpty = Object.keys(data).length === 0;

  return (
    <View style={[styles.card, { marginLeft: depth * 8, borderColor: depth === 0 ? THEME.primary : THEME.borderDefault }]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.indicator, { backgroundColor: depth === 0 ? THEME.primary : THEME.secondary }]} />
          <Text style={styles.sectionTitle}>{label}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {isEmpty ? <Text style={styles.emptyText}>(No Data)</Text> : <PureRecursiveField data={data} depth={depth + 1} path={path} />}
        </View>
      )}
    </View>
  );
};

/**
 * A recursive field component for rendering complex data structures.
 * @param {Object} props - The component props.
 * @param {Object} props.data - The data object to render recursively.
 * @param {number} [props.depth=0] - The current nesting depth.
 * @param {Array<string>} [props.path=[]] - The current data path.
 * @returns {JSX.Element|null} The rendered field or null.
 */
export const PureRecursiveField = ({ data, depth = 0, path = [] }) => {
  const { updateValue } = useContext(DataContext);
  if (!data || typeof data !== 'object') return null;

  return (
    <View style={styles.container}>
      {Object.entries(data).map(([key, value]) => {
        if (key === FIELD_META.DISPLAY_TYPE) return null;

        const currentPath = [...path, key];
        const isObject = value !== null && typeof value === 'object';
        const isBool = typeof value === 'boolean';

        if (isObject && value[FIELD_META.DISPLAY_TYPE]) {
          const displayType = value[FIELD_META.DISPLAY_TYPE];

          if (displayType === FIELD_DISPLAY_TYPE.SKILL_LEVEL_SELECT) {
            return (
              <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
                <Text style={styles.label}>{key}</Text>
                <SkillSelector value={value} path={currentPath} />
              </View>
            );
          }
          if (displayType === FIELD_DISPLAY_TYPE.SINGLE_SELECT_GROUP) {
            return (
              <View key={key} style={{ marginLeft: depth * 12, marginBottom: 16 }}>
                <Text style={styles.label}>{key}</Text>
                <SingleSelectGroup value={value} path={currentPath} />
              </View>
            );
          }
          if (displayType === FIELD_DISPLAY_TYPE.CONNECTION_LEVEL_SELECT) {
            return (
              <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
                <Text style={styles.label}>{key}</Text>
                <ConnectionLevelSelector value={value} path={currentPath} />
              </View>
            );
          }
          if (displayType === FIELD_DISPLAY_TYPE.MONTH_YEAR_PICKER) {
            return (
              <View key={key} style={{ marginLeft: depth * 12 }}>
                <MonthYearPickerInput label={key} valueObj={value} path={currentPath} />
              </View>
            );
          }
          if (displayType === FIELD_DISPLAY_TYPE.DATE_PICKER) {
            return (
              <View key={key} style={{ marginLeft: depth * 12 }}>
                <DatePickerInput label={key} valueObj={value} path={currentPath} />
              </View>
            );
          }
          if (displayType === FIELD_DISPLAY_TYPE.READ_ONLY_STATUS) {
            return (
              <View key={key} style={{ marginLeft: depth * 12 }}>
                <StatusRow label={key} valueObj={value} />
              </View>
            );
          }
        }

        if (isObject) {
          const valKeys = Object.keys(value).filter(k => k !== FIELD_META.DISPLAY_TYPE);
          if (valKeys.length > 0 && valKeys.every(k => SKILL_LEVEL_TEXTS.includes(k))) {
            return (
              <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
                <Text style={styles.label}>{key}</Text>
                <SkillSelector value={value} path={currentPath} />
              </View>
            );
          }
          return <AccordionItem key={key} label={key} data={value} depth={depth} path={currentPath} />;
        }

        if (isBool) {
          return <SwitchRow key={key} label={key} value={value} path={currentPath} />;
        }

        return <InputRow key={key} label={key} value={value} path={currentPath} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.surface,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  indicator: { width: 4, height: 16, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary },
  chevron: { fontSize: 14, color: THEME.textSecondary },
  content: { padding: 16 },
  emptyText: { color: THEME.textSecondary, fontStyle: 'italic' },
  label: { fontSize: 14, color: THEME.textSecondary, marginBottom: 6, fontWeight: '500' },
});
