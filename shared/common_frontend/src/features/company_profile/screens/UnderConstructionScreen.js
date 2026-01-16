import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../../core/theme/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const UnderConstructionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const title = route.params?.title || '現在工事中です';
  const active = title;

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>現在工事中です</Text>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('Jobs')}>
          {active === '求人' ? (
            <View style={styles.activeIconContainer}>
              <Ionicons name="briefcase-outline" size={20} color={THEME.background} />
            </View>
          ) : (
            <Ionicons name="briefcase-outline" size={24} color={THEME.subText} />
          )}
          <Text style={active === '求人' ? styles.navTextActive : styles.navText}>求人</Text>
        </View>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('Connections')}>
          {active === 'つながり' ? (
            <View style={styles.activeIconContainer}>
              <Ionicons name="people-circle-outline" size={20} color={THEME.background} />
            </View>
          ) : (
            <Ionicons name="people-circle-outline" size={24} color={THEME.subText} />
          )}
          <Text style={active === 'つながり' ? styles.navTextActive : styles.navText}>つながり</Text>
        </View>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('TechStack')}>
          <Ionicons name="code-slash-outline" size={24} color={THEME.subText} />
          <Text style={styles.navText}>使用技術</Text>
        </View>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('Blog')}>
          {active === 'ブログ' ? (
            <View style={styles.activeIconContainer}>
              <Ionicons name="newspaper-outline" size={20} color={THEME.background} />
            </View>
          ) : (
            <Ionicons name="newspaper-outline" size={24} color={THEME.subText} />
          )}
          <Text style={active === 'ブログ' ? styles.navTextActive : styles.navText}>ブログ</Text>
        </View>
        <View style={styles.navItem} onTouchEnd={() => navigation.navigate('Events')}>
          {active === 'イベント' ? (
            <View style={styles.activeIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={THEME.background} />
            </View>
          ) : (
            <Ionicons name="calendar-outline" size={24} color={THEME.subText} />
          )}
          <Text style={active === 'イベント' ? styles.navTextActive : styles.navText}>イベント</Text>
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
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: THEME.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: THEME.subText, fontSize: 14, fontWeight: '600' },
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
  navTextActive: { color: THEME.accent, fontSize: 9, marginTop: 4, fontWeight: '800' },
  activeIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: THEME.accent,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
});
