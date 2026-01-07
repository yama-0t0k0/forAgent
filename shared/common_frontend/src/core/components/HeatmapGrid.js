// 役割:
// - スキルやアクティビティを視覚化するためのヒートマップグリッドコンポーネント
// - 90個（デフォルト）のタイルをグリッド状に配置し、ランダムな青色ベースのカラーリングを適用
//
// 主要機能:
// - グリッド生成ロジックの共通化
// - レスポンシブなタイルサイズ計算
// - タイルタップ時のツールチップ表示 (スキル名/レベル詳細)
//
// ディレクトリ構造:
// shared/common_frontend/src/core/components/HeatmapGrid.js
//

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { HeatmapMapper } from '../utils/HeatmapMapper';

const { width } = Dimensions.get('window');

export const HeatmapGrid = ({
  itemCount = 90,
  columns = 9,
  containerWidth = width - 30, // Default to screen width - padding (15*2)
  dataValues = null, // Array of numbers from 0.0 to 1.0
}) => {
  const [selectedTile, setSelectedTile] = useState(null);

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
        value,
        color: getColor(value)
      };
    });
  }, [itemCount, dataValues]);

  // Calculate tile size dynamically based on available width and columns
  // Subtract margin (2 * 2 = 4 per tile)
  const tileSize = (containerWidth / columns) - 4;

  const handlePress = (item, index) => {
    if (selectedTile && selectedTile.id === item.id) {
      setSelectedTile(null);
      return;
    }

    const label = HeatmapMapper.getLabel(item.id) || `Tile ${item.id}`;
    
    // Calculate level (0-4)
    let level = 0;
    const v = item.value;
    if (v > 0.8) level = 4;
    else if (v > 0.5) level = 3;
    else if (v > 0.2) level = 2;
    else if (v > 0) level = 1;

    // Calculate position
    const margin = 2;
    const totalTileSize = tileSize + (margin * 2);
    const row = Math.floor(index / columns);
    const col = index % columns;

    // Tooltip settings
    const tooltipWidth = 140;
    
    // Center alignment
    let left = (col * totalTileSize) + (totalTileSize / 2) - (tooltipWidth / 2);
    
    // Boundary checks
    left = Math.max(0, Math.min(containerWidth - tooltipWidth, left));

    setSelectedTile({
      id: item.id,
      label,
      level,
      // Position just below the tile row
      top: (row + 1) * totalTileSize - 4, // slight overlap for connection feeling
      left,
    });
  };

  return (
    <View style={styles.heatmapGrid} onStartShouldSetResponder={() => true}>
      {gridData.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.heatmapTile,
            {
              backgroundColor: item.color,
              width: tileSize,
              height: tileSize,
              borderWidth: selectedTile?.id === item.id ? 2 : 0,
              borderColor: '#334155', // slate-700
              zIndex: 1,
            }
          ]}
          onPress={() => handlePress(item, index)}
          activeOpacity={0.7}
        />
      ))}

      {selectedTile && (
        <View style={[
          styles.tooltip, 
          { 
            top: selectedTile.top,
            left: selectedTile.left,
            width: 140
          }
        ]}>
          <Text style={styles.tooltipTitle}>{selectedTile.label}</Text>
          <View style={styles.separator} />
          <Text style={styles.tooltipText}>Level: {selectedTile.level}</Text>
          <Text style={styles.tooltipSubText}>
            {selectedTile.level === 0 ? '未経験/興味なし' :
             selectedTile.level === 1 ? '学習中/少し興味' :
             selectedTile.level === 2 ? '基礎/普通' :
             selectedTile.level === 3 ? '応用/やりたい' : '専門/とてもやりたい'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  heatmapTile: {
    margin: 2,
    borderRadius: 4,
    opacity: 0.85,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(30, 41, 59, 0.95)', // Slate-800
    padding: 10,
    borderRadius: 8,
    zIndex: 100, // Ensure it's above tiles
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  tooltipText: {
    color: '#bae6fd', // Sky-200
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tooltipSubText: {
    color: '#94a3b8', // Slate-400
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  }
});
