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
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.detailOverlay} pointerEvents="box-none">
                <View style={[styles.detailWindow, { width, height }]} pointerEvents="auto">
                    {/* Header */}
                    <View style={styles.detailWindowHeader}>
                        {/* Empty view for spacing balance if needed, or just standard flex-start/space-between */}
                        <Text style={styles.detailWindowTitle} numberOfLines={1}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.detailWindowClose} testID="modal_close_button">
                            <Text style={styles.detailWindowCloseText}>閉じる</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.contentContainer}>
                        {loading && (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color={THEME.accent} />
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
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        maxWidth: 800, // Max width for tablet/web
    },
    detailWindowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    detailWindowTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.text,
        flex: 1,
    },
    detailWindowClose: {
        padding: 5,
        marginLeft: 10,
    },
    detailWindowCloseText: {
        color: THEME.accent,
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
        marginTop: 10,
        color: '#64748B',
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
    },
});
