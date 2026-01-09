import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { HeatmapMapper } from '../utils/HeatmapMapper';
import { THEME } from '../theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const MiniHeatmap = ({ data, rows, cols }) => {
  const [selectedTile, setSelectedTile] = useState(null);

  // Calculate tile size based on individual_user_app logic, then reduced to 70%
  // containerWidth = width - 40 (padding)
  // tileSize = (containerWidth / 9) - 4 (margin)
  const baseTileSize = ((SCREEN_WIDTH - 40) / 9) - 4;
  const standardTileSize = baseTileSize * 0.7; // 70% size
  
  const getColor = (value) => {
    if (value === 0) return '#E2E8F0';
    if (value <= 0.2) return '#BAE6FD';
    if (value <= 0.5) return '#7DD3FC';
    if (value <= 0.8) return THEME.accent;
    return '#0369A1';
  };

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
    
    // Calculate approximate position
    const totalTileSize = standardTileSize + 2; // 2px margin (1px each side)
    
    // Tooltip settings
    const tooltipWidth = 90;
    const tooltipHeightApprox = 44;
    
    // Center horizontally relative to tile
    let left = (col * totalTileSize) + (totalTileSize / 2) - (tooltipWidth / 2);
    
    // Constrain to container width (approx)
    const containerWidth = cols * totalTileSize;
    left = Math.max(-20, Math.min(containerWidth - tooltipWidth + 20, left)); // Allow some overflow
    
    const showAbove = row >= Math.max(0, rows - 2);
    const top = showAbove
      ? (row * totalTileSize) - tooltipHeightApprox - 8
      : ((row + 1) * totalTileSize) + 8;

    setSelectedTile({
      id: item.id,
      label,
      level,
      top,
      left,
      showAbove,
      arrowLeft: (col * totalTileSize) + (totalTileSize / 2) - left - 6,
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
