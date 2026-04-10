import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

const VARIANTS = {
    default: { bg: THEME.surfaceInfo, text: THEME.textInfo },
    success: { bg: THEME.surfaceSuccess, text: THEME.textSuccess },
    warning: { bg: THEME.surfaceWarning, text: THEME.textWarning },
    error: { bg: THEME.surfaceError, text: THEME.textError },
    neutral: { bg: THEME.surfaceNeutral, text: THEME.textNeutral },
};

/**
 * A standard status badge component.
 * @param {Object} props
 * @param {string} props.status - Text to display
 * @param {string} [props.variant] - Visual variant ('default' | 'success' | 'warning' | 'error' | 'neutral')
 * @param {Object} [props.style] - Additional styles for the container
 * @param {Object} [props.textStyle] - Additional styles for the text
 */
export const StatusBadge = ({ status, variant = 'default', style, textStyle }) => {
    const theme = VARIANTS[variant] || VARIANTS.default;
    return (
        <View style={[styles.badge, { backgroundColor: theme.bg }, style]} testID='status_badge'>
            <Text style={[styles.text, { color: theme.text }, textStyle]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: THEME.spacing.sm + 2, // 10px equivalent, but following grid
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.md,
        alignSelf: 'flex-start',
    },
    text: {
        ...THEME.typography.micro, // Assuming micro is small enough
        fontWeight: '700',
    },
});
