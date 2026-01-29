import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * A standard primary button component.
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Press handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {boolean} [props.loading] - Whether to show loading indicator
 * @param {Object} [props.style] - Additional styles for the button container
 * @param {Object} [props.textStyle] - Additional styles for the button text
 */
export const PrimaryButton = ({ title, onPress, disabled = false, loading = false, style, textStyle }) => (
    <TouchableOpacity 
        style={[styles.button, disabled && styles.disabled, style]} 
        onPress={onPress}
        disabled={disabled || loading}
        testID="primary_button"
    >
        {loading ? (
            <ActivityIndicator color="#fff" size="small" />
        ) : (
            <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        backgroundColor: THEME.accent,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
