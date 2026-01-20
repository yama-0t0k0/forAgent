import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { JobListItem } from '@shared/src/features/job/components/JobListItem';
import { EngineerListItem } from '@shared/src/features/engineer/components/EngineerListItem';
import { extractSkills, getHighDensityHeatmapData, getCompanyName } from '@shared/src/core/utils/dashboardUtils';
import { BottomNav } from '@shared/src/core/components/BottomNav';

export const ConnectionScreen = ({ navigation, route }) => {
    const { data } = useContext(DataContext);
    const [activeType, setActiveType] = useState('jd'); // 'individual' or 'jd'

    // Mock "Me" if not specified (default to C000000000000)
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

    useEffect(() => {
        const fetchRankedData = async () => {
            if (!data || !currentUserDoc) return;
            setLoading(true);
            try {
                if (activeType === 'jd' && data.jd) {
                    const ranked = await MatchingService.rankCandidates(currentUserDoc, data.jd, 'jd');
                    setRankedJds(ranked);
                } else if (activeType === 'individual' && data.users) {
                    // Match against a default JD or similar
                    const targetJd = data.jd?.[0] || {};
                    const ranked = await MatchingService.rankCandidates(targetJd, data.users, 'individual');
                    setRankedUsers(ranked);
                }
            } catch (err) {
                console.error('Failed to rank candidates:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRankedData();
    }, [data, currentUserDoc, activeType]);

    const renderCandidate = ({ item }) => {
        if (activeType === 'jd') {
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
                    onPress={() => navigation.navigate('JobDescription', { companyId: item.company_ID, jdNumber: item.JD_Number })}
                />
            );
        } else {
            const skills = extractSkills(item);
            const heatmapInfo = getHighDensityHeatmapData(item);

            return (
                <EngineerListItem
                    engineer={item}
                    skills={skills}
                    heatmapData={heatmapInfo}
                    onPress={() => navigation.navigate('MyPage', { userId: item.id, userDoc: item })}
                />
            );
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <Text style={styles.headerTitle}>つながり候補</Text>
            </SafeAreaView>

            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeType === 'jd' && styles.activeTab]}
                    onPress={() => setActiveType('jd')}
                >
                    <Text style={[styles.tabText, activeType === 'jd' && styles.activeTabText]}>求人 (JD)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeType === 'individual' && styles.activeTab]}
                    onPress={() => setActiveType('individual')}
                >
                    <Text style={[styles.tabText, activeType === 'individual' && styles.activeTabText]}>個人 (エンジニア)</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={THEME.accent} />
                </View>
            ) : (
                <FlatList
                    data={activeType === 'jd' ? rankedJds : rankedUsers}
                    renderItem={renderCandidate}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>候補が見つかりません</Text>}
                />
            )}

            <BottomNav navigation={navigation} activeTab="Connection" />
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
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginBottom: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: { borderBottomColor: THEME.accent },
    tabText: { fontSize: 14, color: THEME.subText, fontWeight: '700' },
    activeTabText: { color: THEME.accent },
    listContent: { padding: 15, paddingBottom: 100 },
    emptyText: { textAlign: 'center', marginTop: 50, color: THEME.subText }
});
