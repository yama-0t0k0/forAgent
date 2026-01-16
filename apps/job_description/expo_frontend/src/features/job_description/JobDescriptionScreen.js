import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { HeatmapGrid } from '@shared/src/core/components/HeatmapGrid';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@shared/src/core/firebaseConfig';
import { HeatmapCalculator } from '@shared/src/core/utils/HeatmapCalculator';

const { width } = Dimensions.get('window');

// Mock data for badges (can be replaced with real data later)
const BADGE_ITEMS = [
    { label: '必須スキル', icon: 'star', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル1', icon: 'medal', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル2', icon: 'trophy', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
];

export const JobDescriptionContent = ({ companyId, jdNumber, onEdit }) => {
    const { data: localData } = useContext(DataContext);
    const [firestoreData, setFirestoreData] = useState(null);
    const [heatmapValues, setHeatmapValues] = useState(null);
    const [containerWidth, setContainerWidth] = useState(width);

    // Fetch actual data from Firestore
    useEffect(() => {
        if (!companyId || !jdNumber) return;

        const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdNumber);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const jdData = docSnap.data();
                setFirestoreData(jdData);

                // Calculate heatmap values
                const values = HeatmapCalculator.calculate(jdData);
                setHeatmapValues(values);
            }
        }, (error) => {
            console.error("Firestore error:", error);
        });

        return () => unsubscribe();
    }, [companyId, jdNumber]);

    // Use firestore data if available, otherwise fallback to local data (context)
    const activeData = firestoreData || localData;
    const positionName = activeData['求人基本項目']?.['ポジション名'] || 'ポジション名未設定';

    return (
        <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {/* Using SafeAreaView here to handle notches correctly without ImageBackground */}
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

                    {/* 1. Header Area - Cleaned up */}
                    <View style={styles.headerContainer}>
                        {/* Edit Button (Top Right) - Retained */}
                        <View style={styles.headerActionContainer}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={onEdit}
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
                                <GlassCard
                                    key={index}
                                    label={item.label}
                                    skillName={item.skills[index] || item.skills[0]}
                                    iconName={item.icon}
                                    width={(containerWidth - 45) / 3}
                                />
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

                        <HeatmapGrid
                            containerWidth={width - 40}
                            dataValues={heatmapValues}
                        />

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

export const JobDescriptionScreen = ({ route, companyId: propCompanyId, jdNumber: propJdNumber }) => {
    const navigation = useNavigation();

    // Resolve IDs from props or navigation params (fallback to default for standalone dev)
    const companyId = propCompanyId || route?.params?.companyId || 'B00000';
    const jdNumber = propJdNumber || route?.params?.jdNumber || '02';

    return (
        <JobDescriptionContent 
            companyId={companyId} 
            jdNumber={jdNumber} 
            onEdit={() => navigation.navigate('JobEdit')} 
        />
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
