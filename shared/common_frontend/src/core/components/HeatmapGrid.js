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
import { HeatmapGeometry } from '../utils/HeatmapGeometry';

const { width } = Dimensions.get('window');

export const HeatmapGrid = ({
  itemCount = 90,
  columns = 9,
  containerWidth = width - 30, // Default to screen width - padding (15*2)
  dataValues = null, // Array of numbers from 0.0 to 1.0
  testID,
}) => {
  const [selectedTile, setSelectedTile] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: containerWidth, height: 0 });
  const [tileLayouts, setTileLayouts] = useState({});

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

  const tileSize = Math.floor(containerWidth / columns) - 4;

  const handlePress = (item, index) => {
    console.log(`HeatmapGrid: Tile ${index} pressed (id: ${item.id})`);
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

    const pos = HeatmapGeometry.computeTooltipByFormula({
      index,
      itemCount,
      columns,
      tileSize,
      margin: 2,
      tooltipWidth: 140,
      containerWidth
    });

    setSelectedTile({
      id: item.id,
      label,
      level,
      top: pos.top,
      left: pos.left,
      showAbove: pos.showAbove,
      arrowLeft: pos.arrowLeft,
    });
  };

  return (
    <View 
      testID={testID}
      style={[styles.heatmapGrid, { width: containerWidth }]} 
      onLayout={(e) => {
      const { width: w, height: h } = e.nativeEvent.layout;
      setContainerSize({ width: w, height: h });
    }}>
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
            }
          ]}
          onLayout={(e) => {
            const { x, y, width: w, height: h } = e.nativeEvent.layout;
            setTileLayouts((prev) => {
              if (prev[item.id] && prev[item.id].x === x && prev[item.id].y === y && prev[item.id].width === w && prev[item.id].height === h) return prev;
              return { ...prev, [item.id]: { x, y, width: w, height: h } };
            });
          }}
          onPress={() => handlePress(item, index)}
          activeOpacity={0.7}
          testID={testID ? `${testID}_tile_${index}` : `heatmap_tile_${index}`}
        />
      ))}

      {selectedTile && selectedTile.top !== undefined && (
        <View
          testID={testID ? `${testID}_tooltip` : "heatmap_tooltip"}
          style={[
            styles.tooltip,
            {
              top: selectedTile?.top ?? 0,
              left: selectedTile?.left ?? 0,
              width: 140
            }
          ]}
        >
          {/* Arrow */}
          <View style={[
            styles.tooltipArrow,
            selectedTile?.showAbove ? styles.arrowDown : styles.arrowUp,
            { left: selectedTile?.arrowLeft || 0 }
          ]} />
          <Text style={styles.tooltipTitle} testID={testID ? `${testID}_tooltip_title` : "heatmap_tooltip_title"}>{selectedTile?.label}</Text>
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
    zIndex: 1000, // Ensure it's above everything else
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6, // for arrowUp
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(30, 41, 59, 0.95)',
  },
  arrowUp: {
    top: -6,
    transform: [{ rotate: '0deg' }],
  },
  arrowDown: {
    bottom: -6,
    transform: [{ rotate: '180deg' }],
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
