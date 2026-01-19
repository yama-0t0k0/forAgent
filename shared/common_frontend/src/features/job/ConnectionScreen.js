import React, { useState, useContext, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { MatchingService } from '@shared/src/core/utils/MatchingService';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { ActivityIndicator } from 'react-native';

export const ConnectionScreen = ({ navigation, route }) => {
    const { data } = useContext(DataContext);
    const [activeType, setActiveType] = useState('jd'); // 'individual' or 'jd'

    // Mock "Me" if not specified (default to C000000000000)
    const currentUserDoc = useMemo(() => {
        if (data.users && data.users.length > 0) {
            return data.users.find(u => u.id === 'C000000000000') || data.users[0];
        }
        return data; // Individual App case
    }, [data]);

    const [rankedJds, setRankedJds] = useState([]);
    const [rankedUsers, setRankedUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRankedData = async () => {
            if (!data) return;
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

    const renderCandidate = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                const score = item.matchingScore || 0;
                if (activeType === 'jd') {
                    navigation.navigate('JobDescription', { companyId: item.company_ID, jdNumber: item.JD_Number });
                } else {
                    navigation.navigate('MyPage', { userId: item.id, userDoc: item });
                }
            }}
        >
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                    {activeType === 'jd' ? item.求人タイトル : `${item.基本情報?.姓} ${item.基本情報?.名}`}
                </Text>
                <Text style={styles.cardSub}>
                    {activeType === 'jd' ? `Company ID: ${item.company_ID}` : item.id}
                </Text>
            </View>
            <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>マッチ度</Text>
                <Text style={styles.scoreValue}>{item.matchingScore !== undefined ? `${item.matchingScore}%` : '---'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME.subText} />
        </TouchableOpacity>
    );

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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 4 },
    cardSub: { fontSize: 13, color: THEME.subText },
    scoreContainer: {
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#F0F9FF',
        padding: 8,
        borderRadius: 12
    },
    scoreLabel: { fontSize: 9, color: THEME.accent, fontWeight: 'bold' },
    scoreValue: { fontSize: 15, color: THEME.accent, fontWeight: '900' },
    emptyText: { textAlign: 'center', marginTop: 50, color: THEME.subText }
});
