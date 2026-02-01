import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { SKILL_LEVEL_TEXTS } from '@shared/src/core/constants/index';

import { InputRow } from './InputRow';
import { SwitchRow } from './SwitchRow';
import { SkillSelector } from './SkillSelector';
import { ConnectionLevelSelector } from './ConnectionLevelSelector';
import { MonthYearPickerInput } from './MonthYearPickerInput';
import { DatePickerInput } from './DatePickerInput';
import { SingleSelectGroup } from './SingleSelectGroup';
import { StatusRow } from './StatusRow';

/**
 * @typedef {Object} AccordionItemProps
 * @property {string} label - Section label
 * @property {Object} data - Nested data object
 * @property {number} depth - Nesting depth
 * @property {string[]} path - Data path
 * @property {Object} [orderTemplate] - Template for key ordering
 */

/**
 * Collapsible Accordion Item for RecursiveField.
 * 
 * @param {AccordionItemProps} props
 * @param {string} props.label - Section label
 * @param {Object} props.data - Nested data object
 * @param {number} props.depth - Nesting depth
 * @param {string[]} props.path - Data path
 * @param {Object} [props.orderTemplate] - Template for key ordering
 */
const AccordionItem = ({ label, data, depth, path, orderTemplate }) => {
  const [expanded, setExpanded] = useState(depth === 0);

  /**
   * Toggles the accordion expansion state.
   */
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isEmpty = Object.keys(data).length === 0;

  return (
    <View style={[styles.card, { marginLeft: depth * 8, borderColor: depth === 0 ? THEME.accent : THEME.cardBorder }]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.indicator, { backgroundColor: depth === 0 ? THEME.accent : THEME.secondaryAccent }]} />
          <Text style={styles.sectionTitle}>{String(label)}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {isEmpty ? <Text style={styles.emptyText}>(No Data)</Text> : <RecursiveField data={data} depth={depth + 1} path={path} orderTemplate={orderTemplate} />}
        </View>
      )}
    </View>
  );
};

/**
 * @typedef {Object} RecursiveFieldProps
 * @property {Object} data - Data object to render recursively
 * @property {number} [depth=0] - Current depth
 * @property {string[]} [path=[]] - Data path
 * @property {Object} [orderTemplate=null] - Template for ordering
 */

/**
 * Recursive Field Component.
 * Renders a dynamic form based on a nested data structure.
 * Supports various field types like SkillSelector, SwitchRow, etc.
 * 
 * @param {RecursiveFieldProps} props
 * @param {Object} props.data - Data object to render recursively
 * @param {number} [props.depth=0] - Current depth
 * @param {string[]} [props.path=[]] - Data path
 * @param {Object} [props.orderTemplate=null] - Template for ordering
 */
export const RecursiveField = ({ data, depth = 0, path = [], orderTemplate = null }) => {
  if (!data || typeof data !== 'object') return null;

  /** @type {string[]} */
  const rawKeys = Object.keys(data).filter(k => k !== '_displayType');
  let orderedKeys = rawKeys;
  if (orderTemplate && typeof orderTemplate === 'object') {
    /** @type {string[]} */
    const templateKeys = Object.keys(orderTemplate).filter(k => k !== '_displayType');
    /** @type {string[]} */
    const inTemplate = rawKeys.filter(k => templateKeys.includes(k)).sort((a, b) => templateKeys.indexOf(a) - templateKeys.indexOf(b));
    /** @type {string[]} */
    const notInTemplate = rawKeys.filter(k => !templateKeys.includes(k));
    orderedKeys = [...inTemplate, ...notInTemplate];
  }

  return (
    <View style={{ width: '100%' }}>
      {orderedKeys.map((key) => {

        const value = data[key];
        const currentPath = [...path, key];
        const isObject = value !== null && typeof value === 'object';
        const isBool = typeof value === 'boolean';

        let isSkillLevelObj = false;
        let isSingleSelectGroup = false;
        let isConnectionLevelObj = false;
        let isMonthYearPicker = false;
        let isDatePicker = false;
        let isReadOnlyStatus = false;

        if (isObject) {
          if (value._displayType === 'skillLevelSelect') {
            isSkillLevelObj = true;
          } else if (value._displayType === 'singleSelectGroup') {
            isSingleSelectGroup = true;
          } else if (value._displayType === 'connectionLevelSelect') {
            isConnectionLevelObj = true;
          } else if (value._displayType === 'monthYearPicker') {
            isMonthYearPicker = true;
          } else if (value._displayType === 'datePicker') {
            isDatePicker = true;
          } else if (value._displayType === 'readOnlyStatus') {
            isReadOnlyStatus = true;
          } else {
            /** @type {string[]} */
            const valKeys = Object.keys(value).filter(k => k !== '_displayType');
            if (valKeys.length > 0 && valKeys.every(k => SKILL_LEVEL_TEXTS.includes(k))) {
              isSkillLevelObj = true;
            }
          }
        }

        if (isSkillLevelObj) {
          return (
            <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
              <Text style={styles.label}>{String(key)}</Text>
              <SkillSelector value={value} path={currentPath} />
            </View>
          );
        }

        if (isSingleSelectGroup) {
          return (
            <View key={key} style={{ marginLeft: depth * 12, marginBottom: 16 }}>
              <Text style={styles.label}>{String(key)}</Text>
              <SingleSelectGroup value={value} path={currentPath} />
            </View>
          );
        }

        if (isConnectionLevelObj) {
          return (
            <View key={key} style={{ marginLeft: depth * 12, marginBottom: 12 }}>
              <Text style={styles.label}>{String(key)}</Text>
              <ConnectionLevelSelector value={value} path={currentPath} />
            </View>
          );
        }

        if (isMonthYearPicker) {
          return (
            <View key={key} style={{ marginLeft: depth * 12 }}>
              <MonthYearPickerInput label={key} valueObj={value} path={currentPath} />
            </View>
          );
        }

        if (isDatePicker) {
          return (
            <View key={key} style={{ marginLeft: depth * 12 }}>
              <DatePickerInput label={key} valueObj={value} path={currentPath} />
            </View>
          );
        }

        if (isReadOnlyStatus) {
          return (
            <View key={key} style={{ marginLeft: depth * 12 }}>
              <StatusRow label={key} valueObj={value} />
            </View>
          );
        }

        if (isObject) {
          return <AccordionItem key={key} label={key} data={value} depth={depth} path={currentPath} orderTemplate={orderTemplate ? orderTemplate[key] : null} />;
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
  card: {
    backgroundColor: THEME.cardBg,
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
    backgroundColor: '#F8FAFC',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  indicator: { width: 4, height: 16, borderRadius: 2, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
  chevron: { fontSize: 14, color: THEME.subText },
  content: { padding: 16 },
  emptyText: { color: THEME.subText, fontStyle: 'italic' },
  label: { fontSize: 14, color: THEME.subText, marginBottom: 6, fontWeight: '500' },
});
