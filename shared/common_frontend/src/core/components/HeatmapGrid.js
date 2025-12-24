// 役割:
// - スキルやアクティビティを視覚化するためのヒートマップグリッドコンポーネント
// - 90個（デフォルト）のタイルをグリッド状に配置し、ランダムな青色ベースのカラーリングを適用
//
// 主要機能:
// - グリッド生成ロジックの共通化
// - レスポンシブなタイルサイズ計算
//
// ディレクトリ構造:
// shared/common_frontend/src/core/components/HeatmapGrid.js
//

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

const { width } = Dimensions.get('window');

export const HeatmapGrid = ({ 
  itemCount = 90, 
  columns = 9,
  containerWidth = width - 30, // Default to screen width - padding (15*2)
}) => {
  
  const gridData = useMemo(() => {
    return Array(itemCount).fill(0).map((_, i) => ({
      id: i,
      color: i % 4 === 0 ? THEME.accent :
             i % 4 === 1 ? '#7DD3FC' :
             i % 4 === 2 ? '#38BDF8' : '#0369A1'
    }));
  }, [itemCount]);

  // Calculate tile size dynamically based on available width and columns
  // Subtract margin (2 * 2 = 4 per tile)
  const tileSize = (containerWidth / columns) - 4;

  return (
    <View style={styles.heatmapGrid}>
      {gridData.map((item) => (
        <View 
          key={item.id} 
          style={[
            styles.heatmapTile, 
            { 
              backgroundColor: item.color,
              width: tileSize,
              height: tileSize
            }
          ]} 
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
  },
  heatmapTile: {
    margin: 2,
    borderRadius: 4,
    opacity: 0.75,
  },
});
