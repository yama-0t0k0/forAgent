import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * A standard secondary button component (outlined).
 * @param {Object} props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Press handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {Object} [props.style] - Additional styles for the button container
 * @param {Object} [props.textStyle] - Additional styles for the button text
 */
export const SecondaryButton = ({ title, onPress, disabled = false, style, textStyle }) => (
    <TouchableOpacity 
        style={[styles.button, disabled && styles.disabled, style]} 
        onPress={onPress}
        disabled={disabled}
        testID="secondary_button"
    >
        <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.6,
        backgroundColor: '#F1F5F9',
    },
    text: {
        color: THEME.subText,
        fontWeight: '600',
        fontSize: 14,
    },
});
