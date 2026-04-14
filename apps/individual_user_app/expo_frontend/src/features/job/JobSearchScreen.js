// 役割（機能概要）:
// - 個人向けアプリの求人検索（一覧）画面
// - JobDescriptionService を使った求人取得結果を表示し、詳細画面への導線を提供
// - 既存のデザインシステム（THEME）に準拠した最低限のUIを提供
//
// ディレクトリ構造:
// - apps/individual_user_app/expo_frontend/src/features/job/JobSearchScreen.js (本ファイル)
// - 依存: shared/common_frontend/src/core/services/JobDescriptionService.js
// - 依存: shared/common_frontend/src/core/theme/theme.js
//
// デプロイ・実行方法:
// - ローカル起動: bash scripts/start_expo.sh individual_user_app

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionService } from '@shared/src/core/services/JobDescriptionService';

/**
 * @param {Object} props
 * @param {Object} props.navigation
 * @returns {JSX.Element}
 */
export const JobSearchScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const ROUTE_NAME = {
        JOB_DETAIL: 'JobDetail',
    };

    useEffect(() => {
        /**
         * @returns {Promise<void>}
         */
        const fetchJobs = async () => {
            setLoading(true);
            setErrorMessage('');
            try {
                const results = await JobDescriptionService.listAllJobDescriptions();
                setJobs(results);
            } catch (e) {
                setErrorMessage('求人一覧の取得に失敗しました。');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={THEME.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>求人検索</Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {jobs.map((job) => (
                <TouchableOpacity
                    key={`${job.companyId}-${job.id}`}
                    style={styles.card}
                    onPress={() => navigation.navigate(ROUTE_NAME.JOB_DETAIL, { job })}
                >
                    <Text style={styles.jdNumber}>JD No: {job.id}</Text>
                    <Text style={styles.positionName}>{job.positionName || 'タイトル未設定'}</Text>
                    <Text style={styles.companyText}>法人ID: {job.companyId || '-'}</Text>
                </TouchableOpacity>
            ))}
            {jobs.length === 0 && !errorMessage ? <Text style={styles.emptyText}>求人がありません。</Text> : null}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: THEME.spacing.lg,
        backgroundColor: THEME.background,
        flexGrow: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: THEME.background,
    },
    title: {
        ...THEME.typography.title,
        color: THEME.textPrimary,
        marginBottom: THEME.spacing.md,
        fontWeight: '800',
    },
    errorText: {
        ...THEME.typography.bodySmall,
        color: THEME.error,
        marginBottom: THEME.spacing.md,
    },
    emptyText: {
        ...THEME.typography.bodySmall,
        color: THEME.textSecondary,
        marginTop: THEME.spacing.lg,
    },
    card: {
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        marginBottom: THEME.spacing.md,
        ...THEME.shadow.sm,
    },
    jdNumber: {
        ...THEME.typography.caption,
        color: THEME.textSecondary,
        marginBottom: THEME.spacing.xs,
    },
    positionName: {
        ...THEME.typography.body,
        color: THEME.textPrimary,
        fontWeight: '700',
    },
    companyText: {
        ...THEME.typography.bodySmall,
        color: THEME.textMuted,
        marginTop: THEME.spacing.xs,
    },
});

