// 役割（機能概要）:
// - 個人向けアプリの求人詳細画面
// - JobDescription（モデル）の主要情報を表示する
// - JobSearchScreen から渡された route.params.job を表示対象とする
//
// ディレクトリ構造:
// - apps/individual_user_app/expo_frontend/src/features/job/JobDetailScreen.js (本ファイル)
// - 関連: apps/individual_user_app/expo_frontend/src/features/job/JobSearchScreen.js
// - 依存: shared/common_frontend/src/core/theme/theme.js
//
// デプロイ・実行方法:
// - ローカル起動: bash scripts/start_expo.sh individual_user_app

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @param {Object} props
 * @param {Object} props.route
 * @returns {JSX.Element}
 */
export const JobDetailScreen = ({ route }) => {
    const job = route?.params?.job || null;

    if (!job) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>求人情報が見つかりません。</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{job.positionName || '求人詳細'}</Text>
            <View style={styles.metaCard}>
                <Text style={styles.metaLine}>法人ID: {job.companyId || '-'}</Text>
                <Text style={styles.metaLine}>JD No: {job.id || '-'}</Text>
                <Text style={styles.metaLine}>公開状態: {job.status || '-'}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>求人基本項目</Text>
                <Text style={styles.sectionBody}>{JSON.stringify(job.basicItems || {}, null, 2)}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>スキル要件</Text>
                <Text style={styles.sectionBody}>{JSON.stringify(job.skillsExperience || {}, null, 2)}</Text>
            </View>
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
        padding: THEME.spacing.lg,
    },
    emptyText: {
        ...THEME.typography.bodySmall,
        color: THEME.textSecondary,
    },
    title: {
        ...THEME.typography.title,
        color: THEME.textPrimary,
        fontWeight: '800',
        marginBottom: THEME.spacing.md,
    },
    metaCard: {
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        marginBottom: THEME.spacing.lg,
        ...THEME.shadow.sm,
    },
    metaLine: {
        ...THEME.typography.bodySmall,
        color: THEME.textSecondary,
        marginBottom: THEME.spacing.xs,
    },
    section: {
        marginBottom: THEME.spacing.lg,
    },
    sectionTitle: {
        ...THEME.typography.body,
        color: THEME.textPrimary,
        fontWeight: '700',
        marginBottom: THEME.spacing.sm,
    },
    sectionBody: {
        ...THEME.typography.caption,
        color: THEME.textSecondary,
        backgroundColor: THEME.surface,
        borderRadius: THEME.radius.md,
        padding: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
    },
});

