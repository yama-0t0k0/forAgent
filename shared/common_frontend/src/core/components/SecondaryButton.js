import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * A standard secondary button component (outlined).
 * @param {Object} props
 * @param {string} [props.title] - Button text (optional if children provided)
 * @param {Function} props.onPress - Press handler
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {Object} [props.style] - Additional styles for the button container
 * @param {Object} [props.textStyle] - Additional styles for the button text
 * @param {React.ReactNode} [props.children] - Custom content (overrides title)
 * @param {'standard'|'rounded'|'small'} [props.variant] - Button style variant
 * @param {...Object} [props] - Other props passed to TouchableOpacity
 */
export const SecondaryButton = ({
    title,
    onPress,
    disabled = false,
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
     * Returns the text style object based on the button variant.
     * @returns {Object} The text style object.
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
            disabled={disabled}
            testID='secondary_button'
            {...props}
        >
            {children || <Text style={[styles.text, getVariantTextStyle(), textStyle]}>{title}</Text>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: THEME.surface,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        paddingVertical: THEME.spacing.md - 4, // 12px
        paddingHorizontal: THEME.spacing.lg - 4, // 20px
        borderRadius: THEME.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rounded: {
        borderRadius: THEME.radius.pill,
    },
    small: {
        paddingVertical: THEME.spacing.xs + 1, // 5px
        paddingHorizontal: THEME.spacing.sm + 2, // 10px
        borderRadius: THEME.radius.pill,
    },
    disabled: {
        opacity: 0.6,
        backgroundColor: THEME.surfaceNeutral,
    },
    text: {
        ...THEME.typography.button,
        color: THEME.textSecondary,
    },
    smallText: {
        fontSize: THEME.typography.micro.fontSize + 1, // 11px
    },
});
