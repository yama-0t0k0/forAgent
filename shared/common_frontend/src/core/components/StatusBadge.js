import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

const VARIANTS = {
    default: { bg: '#E0F2FE', text: THEME.accent },
    success: { bg: '#D1FAE5', text: THEME.success },
    warning: { bg: '#FEF3C7', text: '#D97706' },
    error: { bg: '#FEE2E2', text: '#EF4444' },
    neutral: { bg: '#F1F5F9', text: THEME.subText },
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
        <View style={[styles.badge, { backgroundColor: theme.bg }, style]} testID="status_badge">
            <Text style={[styles.text, { color: theme.text }, textStyle]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
    },
});
