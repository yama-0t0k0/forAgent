import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { THEME } from '@shared/src/core/theme/theme';
import { SearchSection } from '../common/SearchSection';
import { DataList } from '../common/DataList';
import { MiniHeatmap } from '../common/MiniHeatmap';
import { styles } from '../../dashboardStyles';

export const IndividualTab = ({ 
  searchQuery, 
  setSearchQuery, 
  filteredUsers, 
  extractSkills, 
  getHighDensityHeatmapData, 
  onUserPress 
}) => (
  <View style={styles.tabContent}>
    <SearchSection 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery}
      placeholder="名前、住所、学校名、IDなどで検索"
      quickFilters={[
        { label: '今月登録', value: 'this_month' },
        { label: 'エンジニア', value: 'engineer' }
      ]}
      onApplyFilter={(val) => console.log('Filter:', val)}
    />
    <DataList 
      data={filteredUsers}
      renderItem={({ item }) => {
        const skills = extractSkills(item);
        const fullName = (item['基本情報']?.['姓'] && item['基本情報']?.['名']) 
          ? `${item['基本情報']['姓']} ${item['基本情報']['名']}`
          : (item.name || '名称未設定');
        
        const hasAnySkill = skills.core.length > 0 || skills.sub1.length > 0 || skills.sub2.length > 0;
        const heatmapInfo = getHighDensityHeatmapData(item);

        return (
          <TouchableOpacity 
            style={styles.glassListItem}
            activeOpacity={0.7}
            onPress={() => onUserPress(item)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.listItemHeader}>
                  <View>
                    <Text style={styles.itemTitleModern}>{fullName}</Text>
                    <Text style={styles.itemSubtitleModern}>ID: {item.id}</Text>
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

                    {skills.sub2.map((skill, i) => (
                      <GlassCard
                        key={`sub2-${i}`}
                        label={i === 0 ? "Sub 2" : ""}
                        skillName={skill}
                        width={42}
                        style={{ marginRight: 6 }}
                        labelStyle={{ fontSize: 9, marginBottom: 3 }}
                        badgeStyle={{
                          backgroundColor: 'rgba(14, 165, 233, 0.05)',
                          borderColor: 'rgba(14, 165, 233, 0.2)',
                          borderWidth: 1,
                          borderRadius: 10,
                        }}
                        skillNameStyle={{
                          color: '#075985',
                          fontSize: 8,
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
