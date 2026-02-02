import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { HeatmapMapper } from '@shared/src/features/analytics/utils/HeatmapMapper';
import { THEME } from '@shared/src/core/theme/theme';
import { HeatmapGeometry } from '@shared/src/features/analytics/utils/HeatmapGeometry';
import { db } from '@shared/src/core/firebaseConfig';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * @typedef {Object} HeatmapData
 * @property {string} id - Tile ID
 * @property {number} value - Heatmap value (0-1)
 */

/**
 * @typedef {Object} MiniHeatmapProps
 * @property {HeatmapData[]} data - Array of heatmap data
 * @property {number} rows - Number of rows
 * @property {number} cols - Number of columns
 */

/**
 * Mini Heatmap Component for displaying activity/skills in a grid.
 * 
 * @param {MiniHeatmapProps} props
 * @param {HeatmapData[]} props.data - Array of heatmap data
 * @param {number} props.rows - Number of rows
 * @param {number} props.cols - Number of columns
 */
export const MiniHeatmap = ({ data, rows, cols }) => {
  const [selectedTile, setSelectedTile] = useState(null);

  const baseTileSize = HeatmapGeometry.computeStandardTileSize();
  const standardTileSize = baseTileSize * 0.7;

  /**
   * Gets the color for a heatmap value.
   * @param {number} value - Normalized value (0-1).
   * @returns {string} Hex color code.
   */
  const getColor = (value) => {
    if (value === 0) return '#E2E8F0';
    if (value <= 0.2) return '#BAE6FD';
    if (value <= 0.5) return '#7DD3FC';
    if (value <= 0.8) return THEME.accent;
    return '#0369A1';
  };

  /**
   * Handles tile press interaction.
   * @param {HeatmapData} item - The heatmap data item.
   * @param {number} index - Index in the data array.
   */
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

    const row = Math.floor(index / cols);
    const col = index % cols;

    const totalTileSize = standardTileSize + 2;
    const tooltipWidth = 90;
    const containerWidth = cols * totalTileSize;
    const pos = HeatmapGeometry.computeTooltipByFormula({
      index,
      itemCount: rows * cols,
      columns: cols,
      tileSize: standardTileSize,
      margin: 1,
      tooltipWidth,
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
    <View style={{ position: 'relative', width: cols * (standardTileSize + 2) }} onStartShouldSetResponder={() => true}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {data.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={{
              width: standardTileSize,
              height: standardTileSize,
              backgroundColor: getColor(item.value),
              margin: 1,
              borderRadius: 4, // Match HeatmapGrid
              borderWidth: selectedTile?.id === item.id ? 2 : 0,
              borderColor: '#334155',
              zIndex: 1
            }}
            onPress={(e) => {
              e.stopPropagation(); // Prevent list item press
              handlePress(item, i);
            }}
            activeOpacity={0.7}
          />
        ))}
      </View>

      {selectedTile && (
        <View style={[
          styles.tooltip,
          {
            top: selectedTile.top,
            left: selectedTile.left,
            width: 90,
            padding: 6,
            borderRadius: 6,
            position: 'absolute',
            zIndex: 999
          }
        ]}>
          <View
            style={[
              styles.tooltipArrow,
              selectedTile.showAbove ? styles.arrowDown : styles.arrowUp,
              { left: selectedTile.arrowLeft },
            ]}
          />
          <Text style={[styles.tooltipTitle, { fontSize: 10, marginBottom: 2 }]} numberOfLines={1}>
            {selectedTile.label}
          </Text>
          <Text style={[styles.tooltipText, { fontSize: 10 }]}>
            Lv {selectedTile.level}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    backgroundColor: '#1E293B',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipTitle: {
    color: '#F1F5F9',
    fontWeight: 'bold',
  },
  tooltipText: {
    color: '#CBD5E1',
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowUp: {
    top: -6,
    borderBottomWidth: 6,
    borderBottomColor: '#1E293B',
  },
  arrowDown: {
    bottom: -6,
    borderTopWidth: 6,
    borderTopColor: '#1E293B',
  },
});
