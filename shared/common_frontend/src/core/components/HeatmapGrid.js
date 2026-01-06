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
  dataValues = null, // Array of numbers from 0.0 to 1.0
}) => {

  const getColor = (value) => {
    if (value === 0) return '#E2E8F0'; // light gray
    if (value <= 0.2) return '#BAE6FD'; // sky-200
    if (value <= 0.5) return '#7DD3FC'; // sky-300
    if (value <= 0.8) return THEME.accent; // sky-500
    return '#0369A1'; // sky-700
  };

  const gridData = useMemo(() => {
    return Array(itemCount).fill(0).map((_, i) => {
      const value = dataValues && dataValues[i] !== undefined ? dataValues[i] : (i % 4 === 0 ? 0.8 : i % 4 === 1 ? 0.3 : i % 4 === 2 ? 0.5 : 1.0);
      return {
        id: i,
        color: getColor(value)
      };
    });
  }, [itemCount, dataValues]);

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
