import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} DetailModalProps
 * @property {boolean} visible - Whether the modal is visible
 * @property {Function} onClose - Function to call when closing
 * @property {string} title - Title of the modal
 * @property {boolean} [loading] - Whether to show loading indicator
 * @property {string|null} [error] - Error message to display
 * @property {React.ReactNode} children - Content to display
 * @property {string} [width] - Width of the modal window (default: '90%')
 * @property {string} [height] - Height of the modal window (default: '85%')
 */

/**
 * A standardized Modal component for displaying details (Job, User, etc.)
 * Provides a consistent UI with overlay, window, header, and close button.
 * 
 * @param {DetailModalProps} props 
 */
export const DetailModal = ({
    visible,
    onClose,
    title,
    loading = false,
    error = null,
    children,
    width = '90%',
    height = '85%'
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType='fade'
            onRequestClose={onClose}
        >
            <View style={styles.detailOverlay} pointerEvents='box-none'>
                <View style={[styles.detailWindow, { width, height }]} pointerEvents='auto'>
                    {/* Header */}
                    <View style={styles.detailWindowHeader}>
                        {/* Empty view for spacing balance if needed, or just standard flex-start/space-between */}
                        <Text style={styles.detailWindowTitle} numberOfLines={1}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.detailWindowClose} testID='modal_close_button'>
                            <Text style={styles.detailWindowCloseText}>閉じる</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {loading && (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size='large' color={THEME.primary} />
                                <Text style={styles.loadingText}>読み込み中...</Text>
                            </View>
                        )}

                        {!loading && error && (
                            <View style={styles.centerContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {!loading && !error && children}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailWindow: {
        backgroundColor: THEME.surface,
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
        ...THEME.shadow.md,
        maxWidth: 800, // Max width for tablet/web
    },
    detailWindowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        backgroundColor: THEME.background,
    },
    detailWindowTitle: {
        ...THEME.typography.h3,
        color: THEME.textPrimary,
        flex: 1,
    },
    detailWindowClose: {
        padding: THEME.spacing.xs,
        marginLeft: THEME.spacing.sm,
    },
    detailWindowCloseText: {
        ...THEME.typography.button,
        color: THEME.primary,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: THEME.spacing.sm,
        color: THEME.textSecondary,
    },
    errorText: {
        color: THEME.textError,
        textAlign: 'center',
    },
});
