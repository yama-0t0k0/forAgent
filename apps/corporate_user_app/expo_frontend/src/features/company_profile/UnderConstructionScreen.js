import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CorporateBottomNav } from '@shared/src/core/components/CorporateBottomNav';

/**
 * A generic screen for features that are under construction.
 * Displays a title and a construction message, along with bottom navigation.
 * @returns {JSX.Element} The rendered screen.
 */
export const UnderConstructionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const title = route.params?.title || '現在工事中です';

  // Map Japanese titles to Tab IDs for CorporateBottomNav
  const titleToTabId = {
    '求人': 'Jobs',
    'つながり': 'Connections',
    '使用技術': 'TechStack',
    'メニュー': 'Menu',
    '企業情報': 'CompanyPage'
  };

  const activeTab = titleToTabId[title] || '';

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>現在工事中です</Text>
      </View>

      {/* Bottom Navigation */}
      <CorporateBottomNav navigation={navigation} activeTab={activeTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: THEME.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: THEME.subText, fontSize: 14, fontWeight: '600' },
});
