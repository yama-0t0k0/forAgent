import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GlassCard } from '../../../core/components/GlassCard';
import { MiniHeatmap } from '../../../core/components/MiniHeatmap';
import { THEME } from '../../../core/theme/theme';
import { JobDescription } from '../../../core/models/JobDescription';

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
  // Use JobDescription model
  const jd = job instanceof JobDescription 
    ? job 
    : JobDescription.fromFirestore(job.JD_Number || job.id, job);

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
                  label="必須スキル"
                  skillName={skill}
                  width={60}
                  style={{ marginRight: 6 }}
                  labelStyle={{ fontSize: 9, marginBottom: 3 }}
                  badgeStyle={{
                    backgroundColor: 'rgba(236, 72, 153, 0.10)',
                    borderColor: 'rgba(236, 72, 153, 0.3)',
                    borderWidth: 1,
                    borderRadius: 10,
                  }}
                  skillNameStyle={{
                    color: '#BE185D',
                    fontSize: 8,
                    fontWeight: 'bold',
                    marginBottom: 0,
                  }}
                />
              ))}

              {skills.sub1.slice(0, 1).map((skill, i) => (
                <GlassCard
                  key={`sub1-${i}`}
                  label="歓迎1"
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
  itemDetail: {
    fontSize: 12,
    color: '#999',
  },
  skillScrollContainer: {
    paddingVertical: 4,
    paddingLeft: 2,
    alignItems: 'flex-start',
  },
  matchBadge: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    minWidth: 50,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.accent,
  },
  matchLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: THEME.accent,
    textTransform: 'uppercase',
  },
});
