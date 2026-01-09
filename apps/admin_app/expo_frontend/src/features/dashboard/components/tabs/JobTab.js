import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { SearchSection } from '../common/SearchSection';
import { DataList } from '../common/DataList';
import { MiniHeatmap } from '../common/MiniHeatmap';
import { styles } from '../../dashboardStyles';

export const JobTab = ({ 
  searchQuery, 
  setSearchQuery, 
  filteredJobs, 
  extractSkills, 
  getHighDensityHeatmapData, 
  getCompanyName, 
  onJobPress 
}) => (
  <View style={styles.tabContent}>
    <SearchSection 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
      placeholder="職種、JD番号で検索"
      quickFilters={[
        { label: '募集中', value: 'open' },
        { label: '急募', value: 'urgent' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
    />
    <DataList 
      data={filteredJobs}
      renderItem={({ item }) => {
        // Normalize skill data for jobs (assuming 'スキル要件' or same structure as user)
        const jobDataForSkills = item['スキル要件'] ? { 'スキル経験': item['スキル要件'] } : item;
        
        const skills = extractSkills(jobDataForSkills);
        const title = item['求人基本項目']?.['ポジション名'] || item.title || 'タイトル未設定';
        const jdNumber = item.JD_Number || '-';
        const companyName = getCompanyName(item.company_ID);
        
        const hasAnySkill = skills.core.length > 0 || skills.sub1.length > 0 || skills.sub2.length > 0;
        const heatmapInfo = getHighDensityHeatmapData(jobDataForSkills);

        return (
          <TouchableOpacity 
            style={styles.glassListItem}
            activeOpacity={0.7}
            onPress={() => onJobPress(item)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.listItemHeader}>
                  <View>
                    <Text style={styles.itemTitleModern}>{title}</Text>
                    <Text style={styles.itemSubtitleModern}>JD No: {jdNumber}</Text>
                    <Text style={styles.itemDetail}>Company: {companyName}</Text>
                  </View>
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

                    {skills.sub2.slice(0, 1).map((skill, i) => (
                      <GlassCard
                        key={`sub2-${i}`}
                        label="歓迎2"
                        skillName={skill}
                        width={42}
                        style={{ marginRight: 6 }}
                        labelStyle={{ fontSize: 9, marginBottom: 3 }}
                        badgeStyle={{
                          backgroundColor: 'rgba(245, 158, 11, 0.10)',
                          borderColor: 'rgba(245, 158, 11, 0.3)',
                          borderWidth: 1,
                          borderRadius: 10,
                        }}
                        skillNameStyle={{
                          color: '#B45309',
                          fontSize: 8,
                          fontWeight: 'bold',
                          marginBottom: 0,
                        }}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Heatmap Area */}
              <View style={{ paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.5)' }}>
                <MiniHeatmap data={heatmapInfo.data} rows={heatmapInfo.rows} cols={heatmapInfo.cols} />
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  </View>
);
