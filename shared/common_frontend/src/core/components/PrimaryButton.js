import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * @param {boolean} [props.useGradient] - Whether to use brand gradient background
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
    useGradient = false,
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

    const gradientColors = [THEME.primary, THEME.secondary];

    const content = loading ? (
        <ActivityIndicator color={THEME.textInverse} size='small' />
    ) : (
        children || <Text style={[styles.text, getVariantTextStyle(), textStyle]}>{title}</Text>
    );

    if (useGradient && !disabled) {
        return (
            <TouchableOpacity
                style={[styles.button, getVariantStyle(), disabled && styles.disabled, style, { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 }]}
                onPress={onPress}
                disabled={disabled || loading}
                testID='primary_button'
                {...props}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.button, getVariantStyle(), { width: '100%' }]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.button, getVariantStyle(), disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            testID='primary_button'
            {...props}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: THEME.primary,
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
    },
    text: {
        ...THEME.typography.button,
        color: THEME.textInverse,
    },
    smallText: {
        fontSize: THEME.typography.micro.fontSize + 1, // 11px
    },
});
