import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { JobListItem } from '@shared/src/features/job/components/JobListItem';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { extractSkills, getHighDensityHeatmapData, getCompanyName } from '@shared/src/core/utils/dashboardUtils';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { DetailModal } from '@shared/src/core/components/DetailModal';
// Import screens directly for modal display (using relative paths for cross-app access in shared)
// Note: This assumes specific directory structure of the monorepo
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';

/**
 * @typedef {Object} ConnectionScreenProps
 * @property {Object} navigation - Navigation object
 * @property {Object} [route] - Route object
 * @property {Object} [route.params] - Route parameters
 * @property {Object} [route.params.userDoc] - User document
 */

/**
 * Connection Screen
 * Displays a list of connection candidates (Jobs or Engineers).
 * 
 * @param {ConnectionScreenProps} props
 */
export const ConnectionScreen = ({ navigation, route, hideSafeArea }) => {
    const HeaderWrapper = hideSafeArea ? View : SafeAreaView;
    const { data } = useContext(DataContext);

    // 2段階タブの状態管理
    // Main Tabs: 'recommendation' (おすすめ) | 'connected' (つながり済)
    const [activeMainTab, setActiveMainTab] = useState('recommendation');

    // Sub Tabs: 
    // - recommendation: 'position' (ポジション) | 'person' (個人)
    // - connected: 'company' (法人) | 'person' (個人)
    const [activeSubTab, setActiveSubTab] = useState('position');

    /**
     * Handle main tab change and set default sub tab.
     * @param {string} tab - 'recommendation' | 'connected'
     */
    const handleMainTabChange = (tab) => {
        setActiveMainTab(tab);
        if (tab === 'recommendation') {
            setActiveSubTab('position');
        } else {
            setActiveSubTab('company');
        }
    };

    /**
     * Current user document based on route params or data context.
     * @type {Object|null}
     */
    const currentUserDoc = useMemo(() => {
        // Adminアプリの場合、userDocがroute.paramsから渡されていない場合がある
        if (route?.params?.userDoc) {
            return route.params.userDoc;
        }

        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
            return data.users.find(u => u.id === 'C000000000000') || data.users[0];
        }

        // 個人アプリの場合、dataそのものがユーザーデータである可能性がある
        if (data && data.id) {
            return data;
        }

        return null;
    }, [data, route?.params?.userDoc]);

    const [rankedJds, setRankedJds] = useState([]);
    const [rankedUsers, setRankedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        /**
         * Fetches and ranks candidates based on the active type.
         */
        const fetchRankedData = async () => {
            if (!data || !currentUserDoc) return;
            setLoading(true);
            try {
                // おすすめタブのロジック
                if (activeMainTab === 'recommendation') {
                    if (activeSubTab === 'position' && data.jd) {
                        const ranked = await MatchingService.rankCandidates(currentUserDoc, data.jd, 'jd');
                        setRankedJds(ranked);
                    } else if (activeSubTab === 'person' && data.users) {
                        // Match current user against other users
                        const ranked = await MatchingService.rankCandidates(currentUserDoc, data.users, 'user');
                        setRankedUsers(ranked);
                    }
                }
                // つながり済タブのロジック (現状はデータソースがないため、空配列または仮実装)
                else if (activeMainTab === 'connected') {
                    // TODO: Implement logic for fetching connected companies/users
                    if (activeSubTab === 'company') {
                        setRankedJds([]);
                    } else if (activeSubTab === 'person') {
                        setRankedUsers([]);
                    }
                }
            } catch (err) {
                // ユーザー画面にエラー帯が表示されないよう console.error を console.log に変更
                console.log('Failed to rank candidates:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRankedData();
    }, [data, currentUserDoc, activeMainTab, activeSubTab]);

    /**
     * Renders a candidate item (Job or Engineer).
     * @param {Object} params
     * @param {Object} params.item - Candidate data
     * @returns {JSX.Element}
     */
    const renderCandidate = ({ item }) => {
        // ポジション(JD)または法人表示の場合
        if (activeSubTab === 'position' || activeSubTab === 'company') {
            const jobDataForSkills = item['スキル要件'] ? { 'スキル経験': item['スキル要件'] } : item;
            const skills = extractSkills(jobDataForSkills);
            const heatmapInfo = getHighDensityHeatmapData(jobDataForSkills);
            const companyName = getCompanyName(item.company_ID, data?.corporate);

            return (
                <JobListItem
                    job={item}
                    skills={skills}
                    heatmapData={heatmapInfo}
                    companyName={companyName}
                    onPress={() => setSelectedJob(item)}
                />
            );
        } else {
            // 個人表示の場合
            const skills = extractSkills(item);
            const heatmapInfo = getHighDensityHeatmapData(item);

            return (
                <EngineerListItem
                    engineer={item}
                    skills={skills}
                    heatmapData={heatmapInfo}
                    onPress={() => setSelectedUser(item)}
                />
            );
        }
    };

    // 現在表示すべきデータリストの決定
    const currentData = useMemo(() => {
        if (activeMainTab === 'recommendation') {
            return activeSubTab === 'position' ? rankedJds : rankedUsers;
        } else {
            // つながり済
            return activeSubTab === 'company' ? [] : []; // 現状は空
        }
    }, [activeMainTab, activeSubTab, rankedJds, rankedUsers]);

    return (
        <View style={styles.container}>
            <HeaderWrapper style={styles.header}>
                <Text style={styles.headerTitle} testID="connection_screen_title">つながり候補</Text>
            </HeaderWrapper>

            {/* Main Tabs (Upper Level) */}
            <View style={styles.mainTabBar}>
                <TouchableOpacity
                    style={[styles.mainTab, activeMainTab === 'recommendation' && styles.activeMainTab]}
                    onPress={() => handleMainTabChange('recommendation')}
                >
                    <Text style={[styles.mainTabText, activeMainTab === 'recommendation' && styles.activeMainTabText]}>おすすめ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainTab, activeMainTab === 'connected' && styles.activeMainTab]}
                    onPress={() => handleMainTabChange('connected')}
                >
                    <Text style={[styles.mainTabText, activeMainTab === 'connected' && styles.activeMainTabText]}>つながり済</Text>
                </TouchableOpacity>
            </View>

            {/* Sub Tabs (Lower Level) */}
            <View style={styles.subTabBarContainer}>
                <View style={styles.subTabBar}>
                    {activeMainTab === 'recommendation' ? (
                        <>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === 'position' && styles.activeSubTab]}
                                onPress={() => setActiveSubTab('position')}
                            >
                                <Text style={[styles.subTabText, activeSubTab === 'position' && styles.activeSubTabText]}>ポジション</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === 'person' && styles.activeSubTab]}
                                onPress={() => setActiveSubTab('person')}
                            >
                                <Text style={[styles.subTabText, activeSubTab === 'person' && styles.activeSubTabText]}>個人</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === 'company' && styles.activeSubTab]}
                                onPress={() => setActiveSubTab('company')}
                            >
                                <Text style={[styles.subTabText, activeSubTab === 'company' && styles.activeSubTabText]}>法人</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === 'person' && styles.activeSubTab]}
                                onPress={() => setActiveSubTab('person')}
                            >
                                <Text style={[styles.subTabText, activeSubTab === 'person' && styles.activeSubTabText]}>個人</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={THEME.accent} />
                </View>
            ) : (
                <FlatList
                    data={currentData}
                    renderItem={renderCandidate}
                    keyExtractor={item => item.id || String(Math.random())}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>候補が見つかりません</Text>}
                />
            )}

            {!hideSafeArea && <BottomNav navigation={navigation} activeTab="Connection" />}

            {/* Job Detail Modal */}
            <DetailModal
                visible={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                title="求人詳細"
            >
                {selectedJob && (
                    <View style={{ flex: 1, overflow: 'hidden' }}>
                        <JobDescriptionScreen
                            companyId={selectedJob.companyId || selectedJob.company_ID}
                            jdNumber={selectedJob.id || selectedJob.JD_Number}
                        />
                    </View>
                )}
            </DetailModal>

            {/* User Detail Modal */}
            <DetailModal
                visible={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                title="個人詳細"
            >
                {selectedUser && (
                    <View style={{ flex: 1 }}>
                        <IndividualProfileScreen
                            userId={selectedUser.id}
                            userDoc={selectedUser}
                            hideSafeArea={true}
                            showBottomNav={true}
                        />
                    </View>
                )}
            </DetailModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        alignItems: 'center',
        paddingVertical: 15
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: THEME.text },

    // Main Tab Styles
    mainTabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        zIndex: 10,
    },
    mainTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeMainTab: {
        borderBottomColor: THEME.accent,
    },
    mainTabText: {
        fontSize: 15,
        color: '#94A3B8', // Lighter color for inactive
        fontWeight: '600',
    },
    activeMainTabText: {
        color: THEME.accent,
        fontWeight: '800', // Bolder for active
    },

    // Sub Tab Styles
    subTabBarContainer: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    subTabBar: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0', // Background for the pill container
        borderRadius: 25,
        padding: 4,
    },
    subTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 20,
    },
    activeSubTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    subTabText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    activeSubTabText: {
        color: THEME.text, // Darker text for readability on white bg
        fontWeight: '800',
    },

    listContent: { padding: 15, paddingBottom: 100 },
    emptyText: { textAlign: 'center', marginTop: 50, color: THEME.subText },
});
