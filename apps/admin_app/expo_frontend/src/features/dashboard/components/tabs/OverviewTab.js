import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { styles } from '../../dashboardStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const OverviewTab = ({ selectionFlowData, userGrowthData, connectionTrendsData, onStepPress }) => (
  <ScrollView style={styles.tabContent} contentContainerStyle={{ paddingBottom: 40 }}>
    {/* Selection Process Flow */}
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>選考プロセス (FMJS)</Text>
      <View style={styles.displayBadge}>
        <Text style={styles.displayBadgeText}>表示: 件数</Text>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flowContainer} contentContainerStyle={{paddingRight: 20}}>
      {selectionFlowData.map((step, index) => (
        <React.Fragment key={step.id}>
          <TouchableOpacity 
            style={styles.whiteCard}
            onPress={() => onStepPress(step)}
          >
            <Text style={styles.cardCount}>{step.count}<Text style={styles.unitText}>件</Text></Text>
            <Text style={styles.cardLabel}>{step.label}</Text>
            <Text style={styles.cardRate}>{step.rate}</Text>
          </TouchableOpacity>
          {index < selectionFlowData.length - 1 && (
            <View style={styles.arrowContainer}><Text style={styles.arrow}>→</Text></View>
          )}
        </React.Fragment>
      ))}
    </ScrollView>

    {/* Middle Row: Satisfaction & Growth */}
    <View style={styles.rowContainer}>
      {/* Matching Satisfaction */}
      <View style={[styles.halfCard, { marginRight: 10 }]}>
        <Text style={styles.cardTitle}>マッチング満足度</Text>
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <PieChart
            data={[
              { value: 20, color: '#4CAF50' }, // 大変満足
              { value: 30, color: '#8BC34A' }, // 満足
              { value: 20, color: '#FFEB3B' }, // 普通
              { value: 10, color: '#FF9800' }, // 不満
              { value: 5, color: '#F44336' }, // 大変不満
            ]}
            donut
            radius={45}
            innerRadius={30}
          />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#4CAF50'}]}/><Text style={styles.legendText}>大変満足</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#8BC34A'}]}/><Text style={styles.legendText}>満足</Text></View>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#FFEB3B'}]}/><Text style={styles.legendText}>普通</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#FF9800'}]}/><Text style={styles.legendText}>不満</Text></View>
          </View>
          <View style={styles.legendRow}>
             <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#F44336'}]}/><Text style={styles.legendText}>大変不満</Text></View>
          </View>
        </View>
      </View>

      {/* User Growth */}
      <View style={[styles.halfCard, { marginLeft: 0 }]}>
        <Text style={styles.cardTitle}>登録ユーザー数推移</Text>
        <BarChart
          data={userGrowthData}
          width={SCREEN_WIDTH * 0.28}
          height={120}
          barWidth={18}
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={0}
          isAnimated
        />
      </View>
    </View>

    {/* Connection Trends */}
    <View style={styles.fullCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>繋がりの推移</Text>
        <View style={styles.segmentControl}>
          <View style={styles.segmentActive}><Text style={styles.segmentTextActive}>個人×企業</Text></View>
          <View style={styles.segmentInactive}><Text style={styles.segmentTextInactive}>個人×個人</Text></View>
        </View>
      </View>
      <LineChart
        data={connectionTrendsData}
        color="#FF9800"
        thickness={3}
        yAxisThickness={0}
        xAxisThickness={0}
        height={150}
        hideDataPoints={false}
        dataPointsColor="#FF9800"
      />
    </View>
  </ScrollView>
);
