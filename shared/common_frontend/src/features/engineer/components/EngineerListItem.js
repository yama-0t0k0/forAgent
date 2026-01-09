import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GlassCard } from '../../../core/components/GlassCard';
import { MiniHeatmap } from '../../../core/components/MiniHeatmap';
import { THEME } from '../../../core/theme/theme';

export const EngineerListItem = ({ 
  engineer, 
  skills, 
  heatmapData, 
  onPress,
  style 
}) => {
  const fullName = (engineer['基本情報']?.['姓'] && engineer['基本情報']?.['名']) 
    ? `${engineer['基本情報']['姓']} ${engineer['基本情報']['名']}`
    : (engineer.name || '名称未設定');
  
  const hasAnySkill = skills?.core?.length > 0 || skills?.sub1?.length > 0 || skills?.sub2?.length > 0;

  return (
    <TouchableOpacity 
      style={[styles.glassListItem, style]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.listItemHeader}>
            <View>
              <Text style={styles.itemTitleModern}>{fullName}</Text>
              <Text style={styles.itemSubtitleModern}>ID: {engineer.id}</Text>
            </View>
          </View>
          
          {hasAnySkill && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.skillScrollContainer}
            >
              {skills.core.map((skill, i) => (
                <GlassCard
                  key={`core-${i}`}
                  label={i === 0 ? "CORE" : ""}
                  skillName={skill}
                  width={60}
                  style={{ marginRight: 6 }}
                  badgeStyle={{
                    backgroundColor: 'rgba(14, 165, 233, 0.15)',
                    borderColor: THEME.accent,
                    borderWidth: 1,
                  }}
                  skillNameStyle={{
                    color: THEME.accent,
                    fontSize: 9,
                    fontWeight: 'bold',
                    marginBottom: 0,
                  }}
                />
              ))}

              {skills.sub1.map((skill, i) => (
                <GlassCard
                  key={`sub1-${i}`}
                  label={i === 0 ? "Sub 1" : ""}
                  skillName={skill}
                  width={42}
                  style={{ marginRight: 6 }}
                  labelStyle={{ fontSize: 9, marginBottom: 3 }}
                  badgeStyle={{
                    backgroundColor: 'rgba(14, 165, 233, 0.10)',
                    borderColor: 'rgba(14, 165, 233, 0.3)',
                    borderWidth: 1,
                    borderRadius: 10,
                  }}
                  skillNameStyle={{
                    color: '#0369A1',
                    fontSize: 8,
                    fontWeight: 'bold',
                    marginBottom: 0,
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {heatmapData && (
          <View pointerEvents="box-none">
            <MiniHeatmap 
              data={heatmapData} 
              rows={3} 
              cols={3} 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  glassListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleModern: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 2,
  },
  itemSubtitleModern: {
    fontSize: 12,
    color: THEME.subText,
    fontWeight: '500',
  },
  skillScrollContainer: {
    paddingVertical: 4,
    paddingLeft: 2,
    alignItems: 'flex-start',
  },
});
