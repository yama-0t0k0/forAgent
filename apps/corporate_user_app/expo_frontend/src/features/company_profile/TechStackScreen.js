import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { TechStackView } from '@shared/src/features/analytics/components/TechStackView';
import { CorporateBottomNav } from '@shared/src/core/components/CorporateBottomNav';

const MOCK_TECH_STACK = {
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

const MOCK_FEATURES = [
  { id: 1, title: 'フルリモート', description: '全国どこでも勤務可能です。' },
  { id: 2, title: 'フレックス', description: 'コアタイムなしのスーパーフレックス制です。' }
];

/**
 * Screen displaying the technology stack of the company.
 * Uses shared TechStackView and CorporateBottomNav.
 * @returns {JSX.Element} The rendered screen.
 */
export const TechStackScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
          <TechStackView 
            techStack={MOCK_TECH_STACK} 
            features={MOCK_FEATURES} 
          />
      </View>
      <CorporateBottomNav navigation={navigation} activeTab="TechStack" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 50, // Basic top spacing
  }
});
