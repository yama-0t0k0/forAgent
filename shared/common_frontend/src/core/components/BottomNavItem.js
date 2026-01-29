import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * Standardized Bottom Navigation Item component.
 * Handles active/inactive states and consistent styling.
 * 
 * @param {Object} props
 * @param {string} props.label - Text label.
 * @param {string} props.icon - Ionicons name.
 * @param {boolean} [props.isActive=false] - Whether the item is active.
 * @param {Function} props.onPress - Press handler.
 * @param {string} [props.activeColor] - Text color when active.
 * @param {string} [props.inactiveColor] - Text/Icon color when inactive.
 * @param {string} [props.activeIconColor] - Icon color when active.
 * @param {string} [props.activeContainerColor] - Container background color when active.
 * @param {Object} [props.style] - Container style.
 */
export const BottomNavItem = ({
  label,
  icon,
  isActive = false,
  onPress,
  style,
  activeColor = THEME.text,
  inactiveColor = THEME.subText,
  activeIconColor = THEME.background,
  activeContainerColor = THEME.text,
}) => {
  return (
    <TouchableOpacity style={[styles.navItem, style]} onPress={onPress} activeOpacity={0.7}>
      {isActive ? (
        <View style={[styles.activeIconContainer, { backgroundColor: activeContainerColor }]}>
          <Ionicons name={icon} size={20} color={activeIconColor} />
        </View>
      ) : (
        <Ionicons name={icon} size={24} color={inactiveColor} />
      )}
      <Text 
        style={[
          styles.navText, 
          { color: isActive ? activeColor : inactiveColor },
          isActive && styles.navTextActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  activeIconContainer: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navText: {
    fontSize: 10,
    marginTop: 2,
  },
  navTextActive: {
    fontWeight: 'bold',
  },
});
