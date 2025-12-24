import React, { useMemo, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock data for badges (can be replaced with real data later)
const BADGE_ITEMS = [
    { label: '必須スキル', icon: 'star', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル1', icon: 'medal', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル2', icon: 'trophy', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
];

export const JobDescriptionScreen = () => {
    const navigation = useNavigation();
    const { data } = useContext(DataContext);

    // Extract data from DataContext (which is loaded from jd.json in App.js)
    const positionName = data['求人基本項目']?.['ポジション名'] || 'ポジション名未設定';

    // Heatmap grid (90 tiles) - Hardcoded pattern matching individual_user_app for now
    const skillGrid = useMemo(() => {
        return Array(90).fill(0).map((_, i) => ({
            id: i,
            color: i % 4 === 0 ? THEME.accent :
                i % 4 === 1 ? '#7DD3FC' :
                    i % 4 === 2 ? '#38BDF8' : '#0369A1'
        }));
    }, []);

    return (
        <View style={styles.container}>
            {/* Using SafeAreaView here to handle notches correctly without ImageBackground */}
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                    
                    {/* 1. Header Area - Cleaned up */}
                    <View style={styles.headerContainer}>
                        {/* Edit Button (Top Right) - Retained */}
                        <View style={styles.headerActionContainer}>
                             <TouchableOpacity 
                                style={styles.editButton} 
                                onPress={() => navigation.navigate('JobEdit')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={24} color={THEME.text} />
                            </TouchableOpacity>
                        </View>

                        {/* NamePlate repurposed as Position Name */}
                        <View style={styles.namePlateContainer}>
                            <View style={styles.namePlate}>
                                <Text style={styles.positionLabel}>募集中ポジション</Text>
                                <Text style={styles.positionNameText}>{positionName}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 2. Glassmorphism Badges */}
                    <View style={styles.badgeSection}>
                        <View style={styles.tradingCardRow}>
                            {BADGE_ITEMS.map((item, index) => (
                                <View key={index} style={styles.tradingCard}>
                                    <Text style={styles.cardLabel}>{item.label}</Text>
                                    <View style={styles.glassBadge}>
                                        <Text style={styles.cardSkillName}>{item.skills[index] || item.skills[0]}</Text>
                                        <Ionicons
                                            name={item.icon}
                                            size={18}
                                            color={THEME.accent}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 3. Heatmap Section */}
                    <View style={styles.heatmapSection}>
                        <View style={styles.heatmapHeader}>
                            <Text style={styles.heatmapTitle}>スキル・志向ヒートマップ</Text>
                            <View style={styles.chatBotIconSmall}>
                                <Ionicons name="chatbubble-outline" size={14} color={THEME.text} />
                            </View>
                        </View>

                        <View style={styles.heatmapGrid}>
                            {skillGrid.map((item) => (
                                <View key={item.id} style={[styles.heatmapTile, { backgroundColor: item.color }]} />
                            ))}
                        </View>

                        <View style={styles.chatBotCallout}>
                            <Ionicons name="chatbubble-ellipses" size={40} color={THEME.accent} />
                            <Text style={styles.labelYellow}>AI分析</Text>
                        </View>
                    </View>

                    {/* Whitespace buffer */}
                    <View style={{ height: 80 }} />

                </ScrollView>

                {/* 4. Bottom Button (Renamed to Job Detail) - No Footer Navigation */}
                <View style={styles.bottomButtonContainer}>
                    <TouchableOpacity style={styles.centerButton} activeOpacity={0.8}>
                        <Text style={styles.centerButtonText}>求人詳細</Text>
                        <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80, // Space for bottom button
    },
    headerContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
        marginBottom: 20,
    },
    headerActionContainer: {
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    editButton: {
        padding: 8,
        backgroundColor: '#E0F2FE', // Light blue background for visibility
        borderRadius: 20,
    },
    namePlateContainer: {
        width: '100%',
        alignItems: 'center',
    },
    namePlate: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    positionLabel: {
        fontSize: 12,
        color: THEME.subText,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    positionNameText: {
        fontSize: 20,
        fontWeight: '800',
        color: THEME.text,
        textAlign: 'center',
    },
    badgeSection: {
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    tradingCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tradingCard: {
        width: (width - 45) / 3,
        alignItems: 'center',
    },
    cardLabel: {
        color: THEME.subText, // Changed from white as background is gone
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 5,
    },
    glassBadge: {
        width: '100%',
        aspectRatio: 1.1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // More opaque since no dark bg
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0F2FE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardSkillName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0284C7',
        marginBottom: 4,
        textAlign: 'center',
    },
    heatmapSection: {
        paddingHorizontal: 15,
        marginTop: 10,
        // Match MyPage style (removed card styling)
    },
    heatmapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    heatmapTitle: {
        color: THEME.text,
        fontSize: 16,
        fontWeight: '800',
        marginRight: 8,
    },
    chatBotIconSmall: {
        backgroundColor: THEME.cardBorder,
        padding: 3,
        borderRadius: 5,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'flex-start',
    },
    heatmapTile: {
        width: (width - 40) / 9 - 4,
        height: (width - 40) / 9 - 4,
        margin: 2,
        borderRadius: 4,
        opacity: 0.75,
    },
    chatBotCallout: {
        position: 'absolute',
        bottom: -20,
        right: 0,
        alignItems: 'center',
        // Match MyPage implicit style or keep existing absolute positioning but adjust
    },
    labelYellow: {
        fontSize: 9,
        fontWeight: 'bold',
        color: THEME.accent,
        marginTop: -2,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    centerButton: {
        backgroundColor: THEME.accent,
        width: 140,
        height: 44,
        borderRadius: 22,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: THEME.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 5,
    },
    centerButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
