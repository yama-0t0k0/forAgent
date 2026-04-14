import React, { useState } from 'react';
import { View, StyleSheet, Alert, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionContent } from '@shared/src/features/job_profile/components/JobDescriptionContent';
import { FMJSService } from '@shared/src/core/utils/FMJSService';

const IONICON_NAME = {
    ALERT: 'alert-circle-outline',
    BACK: 'chevron-back',
};
const ACTIVITY_INDICATOR_SIZE = {
    LARGE: 'large',
};
const APPLY_RESULT = {
    SUCCESS: 'success',
};

/**
 * Premium Job Detail Screen for Individual App.
 * Displays full JD details and handles application process.
 * @returns {JSX.Element}
 */
export const JobDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [isApplying, setIsApplying] = useState(false);

    // Params from JobSearchScreen
    const { companyId, jdNumber } = route.params || {};

    if (!companyId || !jdNumber) {
        return (
            <View style={styles.center}>
                <Ionicons name={IONICON_NAME.ALERT} size={48} color={THEME.error} />
                <Text style={styles.errorTitle}>エラー</Text>
                <Text style={styles.errorText}>求人情報が正しく渡されませんでした。</Text>
                <TouchableOpacity style={styles.backToPrevButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backToPrevButtonText}>戻る</Text>
                </TouchableOpacity>
            </View>
        );
    }

    /**
     * Handles the application process with confirmation and feedback.
     * @returns {Promise<void>}
     */
    const handleApply = async () => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            Alert.alert('エラー', 'ログインが必要です。');
            return;
        }

        if (isApplying) return;

        Alert.alert(
            '応募確認',
            'この求人に応募しますか？\n応募すると企業にあなたのプロフィールが開示されます。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '応募する',
                    style: 'default',
                    onPress: async () => {
                        setIsApplying(true);
                        try {
                            const result = await FMJSService.createMatching(
                                currentUser.uid,
                                companyId,
                                jdNumber,
                                {} // Extra data can be passed here
                            );
                            
                            if (result.success === true || result.status === APPLY_RESULT.SUCCESS) {
                                Alert.alert('応募完了', '応募を受け付けました。企業からの連絡をお待ちください。');
                            } else {
                                Alert.alert('エラー', result.error || '応募に失敗しました。再度お試しください。');
                            }
                        } catch (e) {
                            console.error('Apply failed:', e);
                            Alert.alert('エラー', '予期せぬエラーが発生しました。');
                        } finally {
                            setIsApplying(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Custom Header with Back Button */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name={IONICON_NAME.BACK} size={24} color={THEME.textPrimary} />
                </TouchableOpacity>
            </SafeAreaView>

            <JobDescriptionContent
                companyId={companyId}
                jdNumber={jdNumber}
                onApply={handleApply}
                // Individual app doesn't typically show Edit button on JD detail
            />

            {isApplying && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color={THEME.primary} size={ACTIVITY_INDICATOR_SIZE.LARGE} />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.lg,
    },
    errorTitle: {
        ...THEME.typography.h2,
        color: THEME.textPrimary,
        marginTop: THEME.spacing.md,
    },
    errorText: {
        ...THEME.typography.bodySmall,
        color: THEME.textSecondary,
        marginTop: THEME.spacing.sm,
        textAlign: 'center',
    },
    backToPrevButton: {
        marginTop: THEME.spacing.lg,
        backgroundColor: THEME.primary,
        borderRadius: THEME.radius.full,
        paddingHorizontal: THEME.spacing.lg,
        paddingVertical: THEME.spacing.sm,
    },
    backToPrevButtonText: {
        ...THEME.typography.button,
        color: THEME.textInverse,
        fontWeight: '700',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        width: '100%',
    },
    backButton: {
        marginLeft: THEME.spacing.md,
        marginTop: THEME.spacing.sm,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadow.sm,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.overlayMedium,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingBox: {
        backgroundColor: THEME.surface,
        padding: THEME.spacing.lg,
        borderRadius: THEME.radius.lg,
        ...THEME.shadow.md,
    },
});
