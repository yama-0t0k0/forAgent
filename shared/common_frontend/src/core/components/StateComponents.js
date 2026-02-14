import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * EmptyState - Standard component to show when a list or view has no data.
 * @param {Object} props
 * @param {string} [props.message] - Message to display
 * @param {JSX.Element} [props.icon] - Icon to display
 */
export const EmptyState = ({ message = 'データがありません', icon }) => (
    <View style={styles.centerContainer}>
        {icon}
        <Text style={[THEME.typography.body, styles.message]}>{message}</Text>
    </View>
);

/**
 * ErrorState - Standard component to show when an error occurs.
 * @param {Object} props
 * @param {string} [props.message] - Error message
 * @param {Function} [props.onRetry] - Retry callback
 */
export const ErrorState = ({ message = 'エラーが発生しました', onRetry }) => (
    <View style={styles.centerContainer}>
        <Text style={[THEME.typography.body, styles.errorMessage]}>{message}</Text>
        {onRetry && (
            <Text style={styles.retryText} onPress={onRetry}>
                再試行
            </Text>
        )}
    </View>
);

/**
 * GlobalLoadingOverlay - A full-screen overlay to show during async actions.
 * @param {Object} props
 * @param {boolean} props.visible - Whether the overlay is visible
 * @param {string} [props.message] - Loading message
 */
export const GlobalLoadingOverlay = ({ visible, message }) => {
    if (!visible) return null;
    return (
        <View style={styles.overlay}>
            <View style={styles.loadingBox}>
                <ActivityIndicator size='large' color={THEME.accent} />
                {message && (
                    <Text style={[THEME.typography.caption, styles.loadingText]}>{message}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        padding: THEME.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        color: THEME.subText,
        marginTop: THEME.spacing.sm,
        textAlign: 'center',
    },
    errorMessage: {
        color: THEME.error,
        marginBottom: THEME.spacing.md,
        textAlign: 'center',
    },
    retryText: {
        color: THEME.accent,
        fontWeight: 'bold',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    loadingBox: {
        backgroundColor: THEME.cardBg,
        padding: THEME.spacing.lg,
        borderRadius: THEME.radius.md,
        alignItems: 'center',
        ...THEME.shadow.md,
    },
    loadingText: {
        marginTop: THEME.spacing.sm,
    },
});
