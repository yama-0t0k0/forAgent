import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { MiniHeatmap } from '@shared/src/features/analytics/components/MiniHeatmap';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescription } from '@shared/src/core/models/JobDescription';

/**
 * @typedef {Object} Skills
 * @property {string[]} core - Core skills
 * @property {string[]} sub1 - Sub skills 1
 * @property {string[]} sub2 - Sub skills 2
 */

/**
 * @typedef {Object} JobListItemProps
 * @property {JobDescription|Object} job - Job data
 * @property {Skills} skills - Skills data
 * @property {Object} [heatmapData] - Heatmap data
 * @property {string} [companyName] - Company name
 * @property {function(): void} [onPress] - Press handler
 * @property {Object} [style] - Container style
 * @property {string} [testID] - Test ID
 */

/**
 * Job List Item Component
 * @param {JobListItemProps} props
 */
export const JobListItem = ({
  job,
  skills,
  heatmapData,
  companyName,
  onPress,
  style,
  testID
}) => {
  // Job prop is expected to be a JobDescription model instance
  /** @type {JobDescription} */
  const jd = job;

  const title = jd.positionName || 'タイトル未設定';
  const jdNumber = jd.id || '-';
  
  const hasAnySkill = skills?.core?.length > 0 || skills?.sub1?.length > 0 || skills?.sub2?.length > 0;

  // Handle matching score
  const matchingScore = jd.rawData.matchingScore !== undefined ? jd.rawData.matchingScore : job.matchingScore;

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
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitleModern}>{title}</Text>
              <Text style={styles.itemSubtitleModern}>JD No: {jdNumber}</Text>
              <Text style={styles.itemDetail}>Company: {companyName}</Text>
            </View>
            {matchingScore !== undefined && (
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
              {skills.core.slice(0, 1).map((skill, i) => (
                <GlassCard
                  key={`core-${i}`}
                  label='必須スキル'
                  skillName={skill}
                  width={60}
                  style={{ marginRight: 6 }}
                  labelStyle={{ fontSize: 9, marginBottom: 3 }}
                  badgeStyle={{
                    backgroundColor: 'rgba(139, 92, 246, 0.10)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderWidth: 1,
                    borderRadius: 10,
                  }}
                  skillNameStyle={{
                    color: THEME.secondary,
                    fontSize: 8,
                    fontWeight: 'bold',
                    marginBottom: 0,
                  }}
                />
              ))}

              {skills.sub1.slice(0, 1).map((skill, i) => (
                <GlassCard
                  key={`sub1-${i}`}
                  label='歓迎1'
                  skillName={skill}
                  width={42}
                  style={{ marginRight: 6 }}
                  labelStyle={{ fontSize: 9, marginBottom: 3 }}
                  badgeStyle={{
                    backgroundColor: THEME.surfaceInfo,
                    borderColor: THEME.chartLevel1,
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
  itemDetail: {
    fontSize: 12,
    color: THEME.textMuted,
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
