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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
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
        backgroundColor: '#F1F5F9',
    },
    text: {
        color: THEME.subText,
        fontWeight: '600',
        fontSize: 14,
    },
    smallText: {
        fontSize: 11,
    },
});
