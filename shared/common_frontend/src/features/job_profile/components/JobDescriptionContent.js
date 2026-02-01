import React, { useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { PrimaryButton } from '@shared/src/core/components/PrimaryButton';
import { IconButton } from '@shared/src/core/components/IconButton';
import { HeatmapGrid } from '@shared/src/features/analytics/components/HeatmapGrid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc } from 'firebase/firestore';
import { db } from '@shared/src/core/firebaseConfig';
import { HeatmapCalculator } from '@shared/src/features/analytics/utils/HeatmapCalculator';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { useFirestoreSnapshot } from '@shared/src/core/utils/useFirestore';

const { width } = Dimensions.get('window');

// Mock data for badges (can be replaced with real data later)
const BADGE_ITEMS = [
    { label: '必須スキル', icon: 'star', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル1', icon: 'medal', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル2', icon: 'trophy', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
];

/**
 * Component to display job description content.
 * @param {object} props - Component props
 * @param {string} props.companyId - Company ID
 * @param {string} props.jdNumber - Job Description Number
 * @param {Function} [props.onEdit] - Callback for edit action
 * @returns {JSX.Element} The rendered content.
 */
export const JobDescriptionContent = ({ companyId, jdNumber, onEdit }) => {
    const { data: localData } = useContext(DataContext);
    const [heatmapValues, setHeatmapValues] = useState(null);
    const [containerWidth, setContainerWidth] = useState(width);

    // Use useFirestoreSnapshot for real-time updates
    const docRef = useMemo(() => 
        (companyId && jdNumber) ? doc(db, 'job_description', companyId, 'JD_Number', jdNumber) : null,
        [companyId, jdNumber]
    );
    const { data: firestoreData } = useFirestoreSnapshot(docRef, JobDescription);

    // Use firestore data if available, otherwise fallback to local data (context)
    const activeData = firestoreData || localData;
    
    // Ensure we have a JobDescription instance (hydrate if needed)
    const jd = activeData instanceof JobDescription 
        ? activeData 
        : JobDescription.fromFirestore(jdNumber || '', activeData, companyId || '');

    // Calculate heatmap values when data changes
    useEffect(() => {
        if (jd && jd.rawData) {
            const values = HeatmapCalculator.calculate(jd.rawData);
            setHeatmapValues(values);
        }
    }, [jd]);

    const positionName = jd.positionName || 'ポジション名未設定';

    return (
        <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {/* Using SafeAreaView here to handle notches correctly without ImageBackground */}
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

                    {/* 1. Header Area - Cleaned up */}
                    <View style={styles.headerContainer}>
                        {/* Edit Button (Top Right) - Retained */}
                        {onEdit && (
                            <View style={styles.headerActionContainer}>
                                <IconButton
                                    name="create-outline"
                                    size={24}
                                    color={THEME.text}
                                    style={styles.editButton}
                                    onPress={onEdit}
                                />
                            </View>
                        )}

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
                            containerWidth={containerWidth - 40}
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
                    <PrimaryButton
                        style={styles.centerButton}
                        activeOpacity={0.8}
                        onPress={() => { }}
                    >
                        <Text style={styles.centerButtonText}>求人詳細</Text>
                        <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                    </PrimaryButton>
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
    heatmapSection: {
        paddingHorizontal: 15,
        marginTop: 10,
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
