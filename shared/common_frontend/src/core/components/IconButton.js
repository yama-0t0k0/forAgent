import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * Standardized Icon Button component.
 * Wraps TouchableOpacity with hitSlop and consistent styling.
 * 
 * @param {Object} props
 * @param {string} [props.name] - Ionicons name (optional if children provided).
 * @param {number} [props.size=24] - Icon size.
 * @param {string} [props.color] - Icon color.
 * @param {Function} props.onPress - Press handler.
 * @param {Object} [props.style] - Container style.
 * @param {Object} [props.iconStyle] - Icon style.
 * @param {React.ReactNode} [props.children] - Custom content (overrides name).
 * @param {Object} [props.hitSlop] - Hit slop for touch area.
 * @param {boolean} [props.disabled] - Whether the button is disabled.
 */
export const IconButton = ({ 
  name, 
  size = 24, 
  color = THEME.textPrimary, 
  onPress, 
  style, 
  iconStyle,
  children,
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
  disabled = false,
  ...props 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress} 
      hitSlop={hitSlop}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children ? (
        children
      ) : (
        <Ionicons name={name} size={size} color={color} style={iconStyle} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
