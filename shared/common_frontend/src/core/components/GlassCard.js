// 役割:
// - グラスモーフィズムデザイン（磨りガラス風）のバッジコンポーネント
// - スキル名とアイコンを表示するカード形式のUI
//
// 主要機能:
// - 半透明な背景と境界線によるガラス効果
// - スキル名、アイコン、ラベルの表示
//
// ディレクトリ構造:
// shared/common_frontend/src/core/components/GlassCard.js
//

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} GlassCardProps
 * @property {string} [label] - Top label (e.g. "Main Skill")
 * @property {string} skillName - Name of the skill
 * @property {string} [iconName] - Ionicons name
 * @property {Object} [style] - Container style
 * @property {number|string} [width] - Card width
 * @property {Object} [labelStyle] - Label text style
 * @property {Object} [badgeStyle] - Badge style
 * @property {Object} [skillNameStyle] - Skill name text style
 */

/**
 * Glassmorphism Card Component.
 * Displays a skill/badge with a frosted glass effect.
 * 
 * @param {GlassCardProps} props
 */
export const GlassCard = ({ 
  label, 
  skillName, 
  iconName, 
  style,
  width,
  labelStyle,
  badgeStyle,
  skillNameStyle
}) => {
  return (
    <View style={[styles.container, { width: width }, style]}>
      {label && <Text style={[styles.cardLabel, labelStyle]}>{label}</Text>}
      <View style={[styles.glassBadge, badgeStyle]}>
        <Text style={[styles.cardSkillName, skillNameStyle]}>{skillName}</Text>
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={THEME.primary}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  cardLabel: {
    ...THEME.typography.micro,
    color: THEME.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  glassBadge: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: THEME.surfaceElevated,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.surfaceInfo,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow.sm,
  },
  cardSkillName: {
    ...THEME.typography.micro,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    marginBottom: THEME.spacing.xs,
    textAlign: 'center',
  },
});
