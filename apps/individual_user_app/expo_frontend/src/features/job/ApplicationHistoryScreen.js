import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { FMJSService } from '@shared/src/core/utils/FMJSService';
import { getAuth } from 'firebase/auth';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { APP_TABS } from '@shared/src/core/constants/ui';

const IONICON_NAME = {
    BRIEFCASE: 'briefcase-outline',
    TIME: 'time-outline',
    CHECKMARK_CIRCLE: 'checkmark-circle-outline',
    ALERT_CIRCLE: 'alert-circle-outline',
    CHEVRON_FORWARD: 'chevron-forward',
};

const STATUS_COLORS = {
    'document_screening_書類選考': THEME.primary,
    '1st_interview_1次面接': THEME.secondary || '#8B5CF6',
    '2nd_interview_2次面接': THEME.secondary || '#8B5CF6',
    'final_interview_最終面接': THEME.secondary || '#8B5CF6',
    'offer_オファー面談': THEME.success,
    'joined_入社': THEME.success,
    'rejected_不合格': THEME.error,
    'withdrawn_辞退': THEME.textMuted,
};

/**
 * Application History Screen
 * Displays a list of jobs the user has applied for and their current status.
 */
export const ApplicationHistoryScreen = ({ navigation }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchApplications = useCallback(async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        try {
            const data = await FMJSService.getUserApplications(user.uid);
            // Sort by update timestamp descending
            data.sort((a, b) => {
                const timeA = a.UpdateTimestamp?.toDate?.() || new Date(a.UpdateTimestamp_yyyymmddtttttt);
                const timeB = b.UpdateTimestamp?.toDate?.() || new Date(b.UpdateTimestamp_yyyymmddtttttt);
                return timeB - timeA;
            });
            setApplications(data);
        } catch (error) {
            console.error('[ApplicationHistoryScreen] Failed to fetch:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const getStatusLabel = (phase) => {
        const labels = {
            'document_screening_書類選考': '書類選考中',
            '1st_interview_1次面接': '1次面接',
            '2nd_interview_2次面接': '2次面接',
            'final_interview_最終面接': '最終面接',
            'offer_オファー面談': '内定/オファー',
            'joined_入社': '入社',
            'rejected_不合格': '不合格',
            'withdrawn_辞退': '辞退',
        };
        return labels[phase] || '不明';
    };

    const renderApplicationCard = (app) => {
        const phase = app.選考進捗?.fase_フェイズ;
        const status = app.選考進捗?.status_ステータス;
        const statusColor = STATUS_COLORS[phase] || THEME.textSecondary;

        return (
            <TouchableOpacity
                key={app.id}
                style={styles.card}
                onPress={() => navigation.navigate(ROUTES.JOB_DESCRIPTION, {
                    companyId: app.id_company_法人ID,
                    jdNumber: app.JD_Number
                })}
            >
                <View style={styles.cardMain}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={IONICON_NAME.BRIEFCASE} size={24} color={THEME.primary} />
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.companyName}>法人ID: {app.id_company_法人ID}</Text>
                        <Text style={styles.jdNumber}>求人番号: {app.JD_Number}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {getStatusLabel(phase)}
                                </Text>
                            </View>
                            <Text style={styles.subStatusText}>{status}</Text>
                        </View>
                    </View>
                    <Ionicons name={IONICON_NAME.CHEVRON_FORWARD} size={20} color={THEME.borderDefault} />
                </View>
                <View style={styles.cardFooter}>
                    <Ionicons name={IONICON_NAME.TIME} size={12} color={THEME.textMuted} />
                    <Text style={styles.dateText}>
                        最終更新: {app.UpdateTimestamp?.toDate?.().toLocaleDateString() || new Date(app.UpdateTimestamp_yyyymmddtttttt).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>応募履歴</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />
                    }
                >
                    {applications.length > 0 ? (
                        applications.map(renderApplicationCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name={IONICON_NAME.ALERT_CIRCLE} size={64} color={THEME.borderDefault} />
                            <Text style={styles.emptyText}>応募履歴がありません</Text>
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={() => navigation.navigate(ROUTES.JOB_SEARCH)}
                            >
                                <Text style={styles.searchButtonText}>求人を探す</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}

            <BottomNav navigation={navigation} activeTab={APP_TABS.APPLICATIONS} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.md,
        backgroundColor: THEME.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        alignItems: 'center',
    },
    headerTitle: {
        ...THEME.typography.heading2,
        fontWeight: 'bold',
        color: THEME.textPrimary,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: THEME.spacing.md,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: THEME.surface,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        ...THEME.shadow.sm,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: THEME.radius.md,
        backgroundColor: `${THEME.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    infoContainer: {
        flex: 1,
    },
    companyName: {
        ...THEME.typography.bodySmall,
        fontWeight: 'bold',
        color: THEME.textPrimary,
        marginBottom: 2,
    },
    jdNumber: {
        ...THEME.typography.caption,
        color: THEME.textSecondary,
        marginBottom: THEME.spacing.xs,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: THEME.spacing.sm,
        paddingVertical: 2,
        borderRadius: THEME.radius.sm,
        marginRight: THEME.spacing.sm,
    },
    statusText: {
        ...THEME.typography.micro,
        fontWeight: 'bold',
    },
    subStatusText: {
        ...THEME.typography.micro,
        color: THEME.textMuted,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: THEME.spacing.md,
        paddingTop: THEME.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: THEME.borderDefault,
    },
    dateText: {
        ...THEME.typography.micro,
        color: THEME.textMuted,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        ...THEME.typography.body,
        color: THEME.textMuted,
        marginTop: THEME.spacing.md,
    },
    searchButton: {
        marginTop: THEME.spacing.lg,
        paddingHorizontal: THEME.spacing.xl,
        paddingVertical: THEME.spacing.md,
        backgroundColor: THEME.primary,
        borderRadius: THEME.radius.full,
    },
    searchButtonText: {
        ...THEME.typography.button,
        color: THEME.textInverse,
        fontWeight: 'bold',
    },
});
