import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

/**
 * Screen displaying the technology stack of the company.
 * @returns {JSX.Element} The rendered screen.
 */
export const TechStackScreen = () => {
  const navigation = useNavigation();

  /**
   * Renders a single technology item with badges.
   * @param {string} label - The category label.
   * @param {string} main - The main technology.
   * @param {string} sub - The sub technology.
   * @param {string} iconName - The icon name for the category.
   * @returns {JSX.Element} The rendered item.
   */
  const renderTechItem = (label, main, sub, iconName) => (
    <View style={styles.techItemContainer}>
      <View style={styles.techHeader}>
        <Ionicons name={iconName} size={14} color={THEME.subText} style={{ marginRight: 4 }} />
        <Text style={styles.techLabel}>{label}</Text>
      </View>
      <View style={styles.techBadgeContainer}>
        <View style={[styles.techBadge, styles.techBadgeMain]}>
          <Text style={styles.techBadgeTextMain}>{main}</Text>
        </View>
        {sub && (
          <View style={[styles.techBadge, styles.techBadgeSub]}>
            <Text style={styles.techBadgeTextSub}>{sub}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>使用技術</Text>
        <View style={styles.techGrid}>
          <View style={styles.techColumn}>
            <Text style={styles.subSectionTitle}>言語</Text>
            {renderTechItem('Backend', MOCK_TECH_STACK.languages.backend.main, MOCK_TECH_STACK.languages.backend.sub, 'server-outline')}
            {renderTechItem('Frontend', MOCK_TECH_STACK.languages.frontend.main, MOCK_TECH_STACK.languages.frontend.sub, 'desktop-outline')}
          </View>
          <View style={styles.techColumn}>
            <Text style={styles.subSectionTitle}>その他</Text>
            {renderTechItem('Framework', MOCK_TECH_STACK.others.framework.main, MOCK_TECH_STACK.others.framework.sub, 'layers-outline')}
            {renderTechItem('Cloud', MOCK_TECH_STACK.others.cloud.main, MOCK_TECH_STACK.others.cloud.sub, 'cloud-outline')}
            {renderTechItem('DB', MOCK_TECH_STACK.others.database.main, MOCK_TECH_STACK.others.database.sub, 'server-outline')}
            {renderTechItem('Tools', MOCK_TECH_STACK.others.tools.main, MOCK_TECH_STACK.others.tools.sub, 'construct-outline')}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>求人</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="people-circle-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>つながり</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="code-slash-outline" size={24} color={THEME.accent} />
          <Text style={[styles.navText, { color: THEME.accent, fontWeight: '800' }]}>使用技術</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="newspaper-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>ブログ</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>イベント</Text>
        </View>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('Menu')}>
          <Ionicons name="grid-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>メニュー</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  scrollContent: { padding: 15, paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 10 },
  subSectionTitle: { fontSize: 12, fontWeight: '700', color: THEME.subText, marginBottom: 8, marginTop: 4 },
  techGrid: { flexDirection: 'row', gap: 15 },
  techColumn: { flex: 1 },
  techItemContainer: { marginBottom: 10 },
  techHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  techLabel: { fontSize: 11, color: THEME.subText, fontWeight: '600' },
  techBadgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  techBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1 },
  techBadgeMain: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  techBadgeSub: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  techBadgeTextMain: { fontSize: 11, color: '#0369A1', fontWeight: '700' },
  techBadgeTextSub: { fontSize: 10, color: '#64748B' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    height: 85,
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { color: THEME.subText, fontSize: 9, marginTop: 4, fontWeight: '600' },
});
