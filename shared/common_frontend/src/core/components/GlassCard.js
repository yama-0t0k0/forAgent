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
            color={THEME.accent}
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
    color: THEME.subText,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 5,
  },
  glassBadge: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSkillName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284C7',
    marginBottom: 4,
    textAlign: 'center',
  },
});
