import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * A standard primary button component.
 * @param {Object} props
 * @param {string} [props.title] - Button text (optional if children provided)
 * @param {Function} props.onPress - Press handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {boolean} [props.loading] - Whether to show loading indicator
 * @param {Object} [props.style] - Additional styles for the button container
 * @param {Object} [props.textStyle] - Additional styles for the button text
 * @param {React.ReactNode} [props.children] - Custom content (overrides title)
 * @param {'standard'|'rounded'|'small'} [props.variant] - Button style variant
 * @param {...Object} [props] - Other props passed to TouchableOpacity
 */
export const PrimaryButton = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    style,
    textStyle,
    children,
    variant = 'standard',
    ...props
}) => {
    /**
     * Returns the style object based on the button variant.
     * @returns {Object} The style object.
     */
    const getVariantStyle = () => {
        switch (variant) {
            case 'rounded':
                return styles.rounded;
            case 'small':
                return styles.small;
            default:
                return {};
        }
    };

    /**
     * Returns text style object based on variant
     * @returns {Object}
     */
    const getVariantTextStyle = () => {
        switch (variant) {
            case 'small':
                return styles.smallText;
            default:
                return {};
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getVariantStyle(), disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            testID="primary_button"
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="#fff" size="small" />
            ) : (
                children || <Text style={[styles.text, getVariantTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: THEME.accent,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rounded: {
        borderRadius: 22,
    },
    small: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    smallText: {
        fontSize: 11,
    },
});
