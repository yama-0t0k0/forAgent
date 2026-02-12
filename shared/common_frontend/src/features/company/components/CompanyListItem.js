import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Company } from '@shared/src/core/models/Company';

// Fallback Mock Data matching corporate_user_app
const MOCK_TECH_STACK_FALLBACK = {
  languages: {
    backend: { main: 'Go', sub: 'Python' },
    frontend: { main: 'TypeScript', sub: 'Dart' },
  },
  others: {
    framework: { main: 'React Native', sub: 'Flutter' },
    cloud: { main: 'AWS', sub: 'GCP' },
    database: { main: 'Firestore', sub: 'PostgreSQL' },
    tools: { main: 'GitHub', sub: 'Slack' },
  },
};

/**
 * @typedef {Object} CompanyListItemProps
 * @property {Company|Object} item - Company data
 * @property {Function} [onPress] - Press handler
 * @property {string} [testID] - Test ID
 */

/**
 * Company List Item Component
 * @param {CompanyListItemProps} props
 */
export const CompanyListItem = ({ item, onPress, testID }) => {
  /**
   * Main technologies extracted from tech stack
   * @type {string[]}
   */
  const mainTechs = useMemo(() => {
    // Use item.tech_stack if available, otherwise use fallback for visualization as requested
    // In a real scenario, we might show nothing if data is missing, but requirement is to show "corporate app's tech"
    const techStack = item.tech_stack || MOCK_TECH_STACK_FALLBACK;
    const techs = [];

    if (techStack) {
      // Languages
      if (techStack.languages) {
        if (techStack.languages.backend?.main) techs.push(techStack.languages.backend.main);
        if (techStack.languages.frontend?.main) techs.push(techStack.languages.frontend.main);
      }
      // Others
      if (techStack.others) {
        Object.values(techStack.others).forEach(obj => {
          if (obj.main) techs.push(obj.main);
        });
      }
    }
    return techs;
  }, [item]);

  // Item prop is expected to be a Company model instance
  /** @type {Company} */
  const company = item;

  const companyName = company.name || '名称未設定';
  const address = company.formattedAddress;

  const RootContainer = onPress ? TouchableOpacity : View;

  return (
    <RootContainer style={styles.container} onPress={onPress} testID={testID} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        <Text style={styles.itemTitle}>{companyName}</Text>
        <Text style={styles.itemSubtitle}>ID: {String(company.id || '')}</Text>
        <Text style={styles.itemDetail}>{address}</Text>
      </View>

      <View style={styles.rightContent}>
        <View style={styles.techBadgeContainer}>
          {mainTechs.map((tech, index) => (
            <View key={index} style={styles.techBadge}>
              <Text style={styles.techBadgeText}>{tech}</Text>
            </View>
          ))}
        </View>
      </View>
    </RootContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 0.6,
    marginRight: 8,
  },
  rightContent: {
    flex: 0.4,
    alignItems: 'flex-end',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 12,
    color: '#999',
  },
  techBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  techBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    marginBottom: 4,
  },
  techBadgeText: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '700',
  },
});
