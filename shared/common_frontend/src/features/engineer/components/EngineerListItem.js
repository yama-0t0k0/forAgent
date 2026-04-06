import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { MiniHeatmap } from '@shared/src/features/analytics/components/MiniHeatmap';
import { THEME } from '@shared/src/core/theme/theme';
import { User } from '@shared/src/core/models/User';

/**
 * @typedef {Object} Skills
 * @property {string[]} core - Core skills
 * @property {string[]} sub1 - Sub skills 1
 * @property {string[]} sub2 - Sub skills 2
 */

/**
 * @typedef {Object} EngineerListItemProps
 * @property {User|Object} engineer - Engineer data (User model or raw object)
 * @property {Skills} skills - Skills data
 * @property {Object} [heatmapData] - Heatmap data
 * @property {function(): void} [onPress] - Press handler
 * @property {Object} [style] - Container style
 * @property {string} [testID] - Test ID
 * @property {boolean} [showMatchScore] - Whether to show match score
 */

/**
 * Engineer List Item Component
 * Displays a summary of an engineer's profile.
 * 
 * @param {EngineerListItemProps} props
 */
export const EngineerListItem = ({
  engineer,
  skills,
  heatmapData,
  onPress,
  style,
  testID,
  showMatchScore = true
}) => {
  // Engineer prop is expected to be a User model instance from FirestoreDataService
  /** @type {User} */
  const user = engineer;

  const fullName = user.fullNameKanji || (user.rawData.name) || '名称未設定';
  
  // Handle both flat and nested data for ID via model
  const displayId = user.id || '-';

  const hasAnySkill = skills?.core?.length > 0 || skills?.sub1?.length > 0 || skills?.sub2?.length > 0;

  // Check matching score from rawData or the engineer object itself (if it was an augmented object)
  // Since User model stores rawData, we can check there, but if the 'engineer' prop was an object with 'matchingScore' 
  // at the root which wasn't part of Firestore data, it might be lost if we only look at User properties.
  // However, User constructor takes 'rawData' as the last argument.
  // If we created User from 'engineer' object, 'engineer' is passed as 'rawData'.
  // So user.rawData.matchingScore should exist if engineer.matchingScore existed.
  const matchingScore = user.rawData.matchingScore !== undefined ? user.rawData.matchingScore : engineer.matchingScore;

  return (
    <TouchableOpacity
      style={[styles.glassListItem, style]}
      activeOpacity={0.7}
      onPress={onPress}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
        <View style={styles.listItemHeader}>
            <View>
              <Text style={styles.itemTitleModern}>{fullName}</Text>
              <Text style={styles.itemSubtitleModern}>ID: {displayId}</Text>
            </View>
            {showMatchScore && matchingScore !== undefined && (
              <View style={styles.matchBadge}>
                <Text style={styles.matchScoreText}>{matchingScore}%</Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
            )}
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
                  label={i === 0 ? 'CORE' : ''}
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
                  label={i === 0 ? 'Sub 1' : ''}
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
                    color: THEME.textInfo,
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
          <View pointerEvents='box-none'>
            <MiniHeatmap
              data={heatmapData.data}
              rows={heatmapData.rows || 3}
              cols={heatmapData.cols || 3}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  glassListItem: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.surface,
    ...THEME.shadow.sm,
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
    color: THEME.textPrimary,
    marginBottom: 2,
  },
  itemSubtitleModern: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  skillScrollContainer: {
    paddingVertical: 4,
    paddingLeft: 2,
    alignItems: 'flex-start',
  },
  matchBadge: {
    backgroundColor: THEME.surfaceInfo,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.chartLevel1,
    alignItems: 'center',
    minWidth: 50,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.primary,
  },
  matchLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: THEME.primary,
    textTransform: 'uppercase',
  },
});
