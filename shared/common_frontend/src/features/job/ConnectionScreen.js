import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { CONNECTION_TABS } from '@shared/src/core/constants';
import { SYSTEM_USER_ID } from '@shared/src/core/constants/system';
import { Ionicons } from '@expo/vector-icons';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { User } from '@shared/src/core/models/User';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { JobListItem } from '@shared/src/features/job/components/JobListItem';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { extractSkills, getHighDensityHeatmapData, getCompanyName } from '@shared/src/core/utils/dashboardUtils';
import { useMatching } from '@shared/src/features/job/hooks/useMatching';
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
 * @param {Object} props.navigation - Navigation object
 * @param {Object} [props.route] - Route object
 * @param {boolean} [props.hideSafeArea] - Whether to hide safe area
 */
export const ConnectionScreen = ({ navigation, route, hideSafeArea }) => {
    const HeaderWrapper = hideSafeArea ? View : SafeAreaView;
    const { data } = useContext(DataContext);

    // 2段階タブの状態管理
    // Main Tabs: 'recommendation' (おすすめ) | 'connected' (つながり済)
    const [activeMainTab, setActiveMainTab] = useState(CONNECTION_TABS.MAIN.RECOMMENDATION);

    // Sub Tabs: 
    // - recommendation: 'position' (ポジション) | 'person' (個人)
    // - connected: 'company' (法人) | 'person' (個人)
    const [activeSubTab, setActiveSubTab] = useState(CONNECTION_TABS.SUB.POSITION);

    /**
     * Handle main tab change and set default sub tab.
     * @param {string} tab - 'recommendation' | 'connected'
     */
    const handleMainTabChange = (tab) => {
        setActiveMainTab(tab);
        if (tab === CONNECTION_TABS.MAIN.RECOMMENDATION) {
            setActiveSubTab(CONNECTION_TABS.SUB.POSITION);
        } else {
            setActiveSubTab(CONNECTION_TABS.SUB.COMPANY);
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
            return data.users.find(u => u.id === SYSTEM_USER_ID) || data.users[0];
        }

        // 個人アプリの場合、dataそのものがユーザーデータである可能性がある
        if (data && data.id) {
            return data;
        }

        return null;
    }, [data, route?.params?.userDoc]);

    const { rankedJds, rankedUsers, loading, error, debugInfo, retry } = useMatching(currentUserDoc, data, activeMainTab, activeSubTab);

    // Modal States
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Removed old useEffect logic, replaced by useMatching hook

    /**
     * Renders a candidate item (Job or Engineer).
     * @param {Object} params
     * @param {Object} params.item - Candidate data
     * @returns {JSX.Element}
     */
    const renderCandidate = useCallback(({ item }) => {
        // ポジション(JD)または法人表示の場合
        if (activeSubTab === CONNECTION_TABS.SUB.POSITION || activeSubTab === CONNECTION_TABS.SUB.COMPANY) {
            const skills = extractSkills(item);
            const heatmapInfo = getHighDensityHeatmapData(item);
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
    }, [activeSubTab, data]);

    // 現在表示すべきデータリストの決定
    const currentData = useMemo(() => {
        if (activeMainTab === CONNECTION_TABS.MAIN.RECOMMENDATION) {
            return activeSubTab === CONNECTION_TABS.SUB.POSITION ? rankedJds : rankedUsers;
        } else {
            // つながり済
            return activeSubTab === CONNECTION_TABS.SUB.COMPANY ? [] : []; // 現状は空
        }
    }, [activeMainTab, activeSubTab, rankedJds, rankedUsers]);

    return (
        <View style={styles.container}>
            <HeaderWrapper style={styles.header}>
                <Text style={styles.headerTitle} testID='connection_screen_title'>つながり候補</Text>
            </HeaderWrapper>

            {/* Debug Info Area (API URL & Error) */}
            <View style={{ padding: 4, backgroundColor: error ? THEME.surfaceError : THEME.surfaceInfo, borderBottomWidth: 1, borderColor: THEME.borderDefault }}>
                <Text style={{ fontSize: 10, color: THEME.textPrimary }}>
                    API: {debugInfo?.apiUrl || 'Checking...'}
                </Text>
                <Text style={{ fontSize: 10, color: THEME.textSecondary }}>
                     Last Updated: {debugInfo?.lastUpdated || 'Never'}
                </Text>
                {error && <Text style={{ fontSize: 10, color: THEME.error, fontWeight: 'bold' }}>Error: {error}</Text>}
            </View>

            {/* Main Tabs (Upper Level) */}
            <View style={styles.mainTabBar}>
                <TouchableOpacity
                    style={[styles.mainTab, activeMainTab === CONNECTION_TABS.MAIN.RECOMMENDATION && styles.activeMainTab]}
                    onPress={() => handleMainTabChange(CONNECTION_TABS.MAIN.RECOMMENDATION)}
                >
                    <Text style={[styles.mainTabText, activeMainTab === CONNECTION_TABS.MAIN.RECOMMENDATION && styles.activeMainTabText]}>おすすめ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainTab, activeMainTab === CONNECTION_TABS.MAIN.CONNECTED && styles.activeMainTab]}
                    onPress={() => handleMainTabChange(CONNECTION_TABS.MAIN.CONNECTED)}
                >
                    <Text style={[styles.mainTabText, activeMainTab === CONNECTION_TABS.MAIN.CONNECTED && styles.activeMainTabText]}>つながり済</Text>
                </TouchableOpacity>
            </View>

            {/* Sub Tabs (Lower Level) */}
            <View style={styles.subTabBarContainer}>
                <View style={styles.subTabBar}>
                    {activeMainTab === CONNECTION_TABS.MAIN.RECOMMENDATION ? (
                        <>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === CONNECTION_TABS.SUB.POSITION && styles.activeSubTab]}
                                onPress={() => setActiveSubTab(CONNECTION_TABS.SUB.POSITION)}
                            >
                                <Text style={[styles.subTabText, activeSubTab === CONNECTION_TABS.SUB.POSITION && styles.activeSubTabText]}>ポジション</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === CONNECTION_TABS.SUB.PERSON && styles.activeSubTab]}
                                onPress={() => setActiveSubTab(CONNECTION_TABS.SUB.PERSON)}
                            >
                                <Text style={[styles.subTabText, activeSubTab === CONNECTION_TABS.SUB.PERSON && styles.activeSubTabText]}>個人</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === CONNECTION_TABS.SUB.COMPANY && styles.activeSubTab]}
                                onPress={() => setActiveSubTab(CONNECTION_TABS.SUB.COMPANY)}
                            >
                                <Text style={[styles.subTabText, activeSubTab === CONNECTION_TABS.SUB.COMPANY && styles.activeSubTabText]}>法人</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.subTab, activeSubTab === CONNECTION_TABS.SUB.PERSON && styles.activeSubTab]}
                                onPress={() => setActiveSubTab(CONNECTION_TABS.SUB.PERSON)}
                            >
                                <Text style={[styles.subTabText, activeSubTab === CONNECTION_TABS.SUB.PERSON && styles.activeSubTabText]}>個人</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size='large' color={THEME.accent} />
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

            {!hideSafeArea && <BottomNav navigation={navigation} activeTab='Connection' />}

            {/* Job Detail Modal */}
            <DetailModal
                visible={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                title='求人詳細'
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
                title='個人詳細'
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
    container: { flex: 1, backgroundColor: THEME.background },
    header: {
        backgroundColor: THEME.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        alignItems: 'center',
        paddingVertical: 15
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: THEME.textPrimary },

    // Main Tab Styles
    mainTabBar: {
        flexDirection: 'row',
        backgroundColor: THEME.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.borderDefault,
        ...THEME.shadow.sm,
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
        borderBottomColor: THEME.primary,
    },
    mainTabText: {
        fontSize: 15,
        color: THEME.borderNeutral, // Lighter color for inactive
        fontWeight: '600',
    },
    activeMainTabText: {
        color: THEME.primary,
        fontWeight: '800', // Bolder for active
    },

    // Sub Tab Styles
    subTabBarContainer: {
        backgroundColor: THEME.surfaceInput,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    subTabBar: {
        flexDirection: 'row',
        backgroundColor: THEME.borderDefault, // Background for the pill container
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
        backgroundColor: THEME.surface,
        ...THEME.shadow.sm,
    },
    subTabText: {
        fontSize: 13,
        color: THEME.textSecondary,
        fontWeight: '600',
    },
    activeSubTabText: {
        color: THEME.textPrimary, // Darker text for readability on white bg
        fontWeight: '800',
    },

    listContent: { padding: 15, paddingBottom: 100 },
    emptyText: { textAlign: 'center', marginTop: 50, color: THEME.textSecondary },
});
