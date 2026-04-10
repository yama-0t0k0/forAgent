import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { DATA_TYPE } from '@shared/src/core/constants/system';

/**
 * Standardized Bottom Navigation Item component.
 * Handles active/inactive states and consistent styling.
 * 
 * @param {Object} props
 * @param {string} props.label - Text label.
 * @param {string|React.ReactNode} props.icon - Ionicons name or custom icon component.
 * @param {boolean} [props.isActive=false] - Whether the item is active.
 * @param {Function} props.onPress - Press handler.
 * @param {string} [props.activeColor] - Text color when active.
 * @param {string} [props.inactiveColor] - Text/Icon color when inactive.
 * @param {string} [props.activeIconColor] - Icon color when active.
 * @param {string} [props.activeContainerColor] - Container background color when active.
 * @param {Object} [props.style] - Container style.
 * @param {Object} [props.textStyle] - Text style.
 */
export const BottomNavItem = ({
  label,
  icon,
  isActive = false,
  onPress,
  style,
  textStyle,
  activeColor = THEME.textPrimary,
  inactiveColor = THEME.textSecondary,
  activeIconColor = THEME.textInverse,
  activeContainerColor = THEME.primary,
  ...props
}) => {
  /**
   * Renders the icon based on whether it is a string or a React element.
   * @param {number} size - The icon size.
   * @param {string} color - The icon color.
   * @returns {React.ReactNode} The rendered icon.
   */
  const renderIcon = (size, color) => {
    if (typeof icon === DATA_TYPE.STRING) {
      return <Ionicons name={icon} size={size} color={color} />;
    }
    return icon;
  };

  return (
    <TouchableOpacity
      style={[styles.navItem, style]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      {isActive ? (
        <View style={[styles.activeIconContainer, { backgroundColor: activeContainerColor }]}>
          {renderIcon(20, activeIconColor)}
        </View>
      ) : (
        renderIcon(24, inactiveColor)
      )}
      {label && (
        <Text
          style={[
            styles.navText,
            { color: isActive ? activeColor : inactiveColor },
            isActive && styles.navTextActive,
            textStyle
          ]}
        >
          {label}
        </Text>
      )}
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
    borderRadius: THEME.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.xs / 2,
  },
  navText: {
    fontSize: 10,
    marginTop: THEME.spacing.xs / 2,
  },
  navTextActive: {
    fontWeight: 'bold',
  },
});
