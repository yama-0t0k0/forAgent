import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
    SafeAreaView,
    Platform,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionService } from '@shared/src/core/services/JobDescriptionService';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { BottomNav } from '@shared/src/core/components/BottomNav';

const STATUS_BAR_STYLE = {
    DARK: 'dark-content',
};
const BOTTOM_NAV_TAB = {
    SEARCH: 'Search',
};
const IONICON_NAME = {
    SEARCH: 'search',
    OPTIONS: 'options-outline',
    REFRESH: 'refresh',
    SEARCH_OUTLINE: 'search-outline',
    CLOSE: 'close',
    CHECKBOX: 'checkbox',
    SQUARE_OUTLINE: 'square-outline',
};
const LOCATION_OPTIONS = [
    '東京都',
    '神奈川県',
    '千葉県',
    '埼玉県',
    '大阪府',
    '京都府',
    '愛知県',
    '福岡県',
    'リモート',
];
const FEATURE_OPTIONS = [
    '20%ルール(30%ルール)などがある',
    'CEOが元エンジニア',
    'CTOが取締役になっている',
    'エンジニアがプロダクトの方向性について発言権をもつ',
    '副業OK',
    '原則フルリモート勤務',
    '書籍購入補助制度がある',
    '選択的にリモート勤務可能',
];
const EMPTY_FILTERS = {
    freeWord: '',
    positionName: '',
    locations: [],
    features: [],
    detailedFields: {},
};

/**
 * Premium Job Search Screen
 * Implements "Wanderlust Search" with advanced filtering and exact match support.
 * @param {Object} navigation - React Navigation navigation object.
 * @returns {JSX.Element}
 */
export const JobSearchScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdvancedModalVisible, setIsAdvancedModalVisible] = useState(false);
    
    // Search State
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    /**
     * @returns {Promise<void>}
     */
    const performSearch = useCallback(async () => {
        setLoading(true);
        try {
            const results = await JobDescriptionService.searchJobs(filters);
            setJobs(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        performSearch();
    }, [performSearch]);

    /**
     * @param {string} loc
     * @returns {void}
     */
    const toggleLocation = (loc) => {
        setFilters((prev) => ({
            ...prev,
            locations: prev.locations.includes(loc) 
                ? prev.locations.filter((l) => l !== loc)
                : [...prev.locations, loc],
        }));
    };

    /**
     * @param {string} feat
     * @returns {void}
     */
    const toggleFeature = (feat) => {
        setFilters((prev) => ({
            ...prev,
            features: prev.features.includes(feat) 
                ? prev.features.filter((f) => f !== feat)
                : [...prev.features, feat],
        }));
    };

    /**
     * @param {Object} job
     * @returns {JSX.Element}
     */
    const renderJobCard = (job) => (
        <TouchableOpacity 
            key={`${job.companyId}-${job.id}`} 
            style={styles.card}
            onPress={() => navigation.navigate(ROUTES.JOB_DESCRIPTION, { 
                companyId: job.companyId, 
                jdNumber: job.id 
            })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.jdBadge}>JD {job.id}</Text>
                <Text style={styles.companyName}>法人ID: {job.companyId}</Text>
            </View>
            <Text style={styles.jobTitle}>{job.positionName}</Text>
            <View style={styles.tagRow}>
                {Object.keys(job.basicItems?.['勤務地'] || {})
                    .filter((k) => job.basicItems?.['勤務地'][k])
                    .map((loc) => (
                    <View key={loc} style={styles.tag}><Text style={styles.tagText}>{loc}</Text></View>
                ))}
            </View>
            <Text style={styles.updatedAt}>更新: {job.updatedAt?.toDate().toLocaleDateString() || '-'}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={STATUS_BAR_STYLE.DARK} />
            
            {/* Glassmorphism Header */}
            <View style={styles.header}>
                <View style={styles.searchBarContainer}>
                    <Ionicons
                        name={IONICON_NAME.SEARCH}
                        size={20}
                        color={THEME.textMuted}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder='フリーワード (AND/OR, 完全一致)'
                        value={filters.freeWord}
                        onChangeText={(text) => setFilters((prev) => ({ ...prev, freeWord: text }))}
                        onSubmitEditing={performSearch}
                    />
                    <TouchableOpacity onPress={() => setIsAdvancedModalVisible(true)}>
                        <Ionicons name={IONICON_NAME.OPTIONS} size={24} color={THEME.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* quick filters */}
                <Text style={styles.sectionTitle}>勤務地</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipRow}>
                    {LOCATION_OPTIONS.map((loc) => (
                        <TouchableOpacity 
                            key={loc} 
                            style={[styles.chip, filters.locations.includes(loc) && styles.chipActive]}
                            onPress={() => toggleLocation(loc)}
                        >
                            <Text style={[styles.chipText, filters.locations.includes(loc) && styles.chipTextActive]}>{loc}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.resultHeader}>
                    <Text style={styles.resultCount}>{jobs.length} 件の求人</Text>
                    <TouchableOpacity onPress={performSearch} style={styles.refreshBtn}>
                        <Ionicons name={IONICON_NAME.REFRESH} size={16} color={THEME.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} color={THEME.primary} size='large' />
                ) : (
                    jobs.map(renderJobCard)
                )}

                {jobs.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name={IONICON_NAME.SEARCH_OUTLINE} size={64} color={THEME.borderDefault} />
                        <Text style={styles.emptyText}>条件に合う求人が見つかりませんでした</Text>
                    </View>
                )}
            </ScrollView>

            <BottomNav navigation={navigation} activeTab={BOTTOM_NAV_TAB.SEARCH} />

            {/* Advanced Filters Modal */}
            <Modal
                visible={isAdvancedModalVisible}
                animationType='slide'
                transparent={false}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsAdvancedModalVisible(false)}>
                            <Ionicons name={IONICON_NAME.CLOSE} size={28} color={THEME.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>詳細検索</Text>
                        <TouchableOpacity onPress={() => setFilters(EMPTY_FILTERS)}>
                            <Text style={styles.resetText}>リセット</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScroll}>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>ポジション・求人名</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder='例: エンジニア OR デザイナー'
                                value={filters.positionName}
                                onChangeText={(text) => setFilters((prev) => ({ ...prev, positionName: text }))}
                            />
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>こだわり条件</Text>
                            <View style={styles.checkboxGrid}>
                                {FEATURE_OPTIONS.map((f) => (
                                    <TouchableOpacity 
                                        key={f} 
                                        style={[styles.checkbox, filters.features.includes(f) && styles.checkboxActive]}
                                        onPress={() => toggleFeature(f)}
                                    >
                                        <Ionicons 
                                            name={filters.features.includes(f) ? IONICON_NAME.CHECKBOX : IONICON_NAME.SQUARE_OUTLINE} 
                                            size={20} 
                                            color={filters.features.includes(f) ? THEME.primary : THEME.textMuted} 
                                        />
                                        <Text style={styles.checkboxLabel}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Detailed Fields (Simplified mock of Individual.json structure) */}
                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>スキル・経験</Text>
                            <Text style={styles.subHint}>Individual.jsonの全フィールドを網羅する予定のエリアです</Text>
                            {/* Placeholder for complex nesting */}
                            <View style={styles.placeholderBox}>
                                <Text style={styles.placeholderText}>言語、DB、OS等の高度なマッピング...</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity 
                            style={styles.applyBtn} 
                            onPress={() => {
                                performSearch();
                                setIsAdvancedModalVisible(false);
                            }}
                        >
                            <Text style={styles.applyBtnText}>結果を表示する</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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
        paddingVertical: THEME.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        backgroundColor: THEME.surfaceGlassHigh,
        ...Platform.select({
            ios: {
                shadowColor: THEME.shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.full,
        paddingHorizontal: THEME.spacing.md,
        height: 48,
    },
    searchIcon: {
        marginRight: THEME.spacing.xs,
    },
    searchInput: {
        flex: 1,
        ...THEME.typography.body,
        color: THEME.textPrimary,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: THEME.spacing.md,
        paddingBottom: 100,
    },
    sectionTitle: {
        ...THEME.typography.bodySmall,
        fontWeight: 'bold',
        color: THEME.textMuted,
        marginBottom: THEME.spacing.sm,
    },
    filterChipRow: {
        marginBottom: THEME.spacing.lg,
    },
    chip: {
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.full,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        marginRight: THEME.spacing.xs,
        backgroundColor: THEME.surface,
    },
    chipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    chipText: {
        ...THEME.typography.caption,
        color: THEME.textSecondary,
    },
    chipTextActive: {
        color: THEME.textInverse,
        fontWeight: 'bold',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    resultCount: {
        ...THEME.typography.title,
        fontSize: 18,
    },
    refreshBtn: {
        padding: THEME.spacing.xs,
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: THEME.spacing.xs,
    },
    jdBadge: {
        ...THEME.typography.caption,
        backgroundColor: THEME.surfaceElevated,
        paddingHorizontal: THEME.spacing.xs,
        paddingVertical: 2,
        borderRadius: THEME.radius.sm,
        color: THEME.primary,
        fontWeight: 'bold',
    },
    companyName: {
        ...THEME.typography.caption,
        color: THEME.textMuted,
    },
    jobTitle: {
        ...THEME.typography.body,
        fontWeight: '800',
        color: THEME.textPrimary,
        marginBottom: THEME.spacing.sm,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: THEME.spacing.sm,
    },
    tag: {
        backgroundColor: THEME.chartLevel1,
        paddingHorizontal: THEME.spacing.xs,
        paddingVertical: 2,
        borderRadius: THEME.radius.sm,
        marginRight: THEME.spacing.xs,
        marginBottom: THEME.spacing.xs,
    },
    tagText: {
        ...THEME.typography.micro,
        color: THEME.primary,
    },
    updatedAt: {
        ...THEME.typography.caption,
        color: THEME.textMuted,
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        ...THEME.typography.body,
        color: THEME.textMuted,
        marginTop: THEME.spacing.md,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
    },
    modalTitle: {
        ...THEME.typography.body,
        fontWeight: 'bold',
    },
    resetText: {
        color: THEME.primary,
        ...THEME.typography.bodySmall,
    },
    modalScroll: {
        flex: 1,
        padding: THEME.spacing.md,
    },
    modalSection: {
        marginBottom: THEME.spacing.xl,
    },
    modalSectionTitle: {
        ...THEME.typography.body,
        fontWeight: 'bold',
        marginBottom: THEME.spacing.md,
    },
    modalInput: {
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.md,
        padding: THEME.spacing.md,
        ...THEME.typography.body,
    },
    checkboxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: THEME.spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: THEME.borderDefault,
    },
    checkboxLabel: {
        ...THEME.typography.bodySmall,
        marginLeft: THEME.spacing.sm,
        color: THEME.textPrimary,
    },
    subHint: {
        ...THEME.typography.caption,
        color: THEME.textMuted,
        marginBottom: THEME.spacing.sm,
    },
    placeholderBox: {
        height: 100,
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: THEME.borderDefault,
    },
    placeholderText: {
        ...THEME.typography.caption,
        color: THEME.textMuted,
    },
    modalFooter: {
        padding: THEME.spacing.md,
        borderTopWidth: 1,
        borderTopColor: THEME.borderDefault,
    },
    applyBtn: {
        backgroundColor: THEME.primary,
        borderRadius: THEME.radius.full,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadow.md,
    },
    applyBtnText: {
        ...THEME.typography.body,
        color: THEME.textInverse,
        fontWeight: 'bold',
    },
});
