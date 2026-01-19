import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { HeatmapGrid } from '@shared/src/core/components/HeatmapGrid';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { FMJSService } from '@shared/src/core/utils/FMJSService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@shared/src/core/firebaseConfig';
import { HeatmapCalculator } from '@shared/src/core/utils/HeatmapCalculator';
import { BottomNav } from '@shared/src/core/components/BottomNav';

const { width } = Dimensions.get('window');

// Mock data for badges (can be replaced with real data later)
const BADGE_ITEMS = [
    { label: '必須スキル', icon: 'star', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル1', icon: 'medal', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
    { label: '歓迎スキル2', icon: 'trophy', skills: ['サーバサイド', 'クラウド', 'CI/CD'] },
];

export const JobDescriptionContent = ({ companyId, jdNumber, onEdit }) => {
    const { data: localData } = useContext(DataContext);
    const [isBottomReached, setIsBottomReached] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [firestoreData, setFirestoreData] = useState(null);
    const [heatmapValues, setHeatmapValues] = useState({});
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

    const handleAction = (type) => {
        if (!isBottomReached && type !== 'connection') return;

        const actionText = type === 'interview' ? '面談' : type === 'formal' ? '面接' : 'つながり';

        const confirmMsg = "この企業にあなたの職務経歴など必要な個人情報が開示されます。よろしいですか？";

        import('react-native').then(({ Alert }) => {
            Alert.alert(
                `${actionText}希望の確認`,
                confirmMsg,
                [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                        text: 'OK',
                        onPress: async () => {
                            const userId = 'C000000000000'; // Default for demo, should be dynamic
                            setIsMatching(true);
                            const result = await FMJSService.createMatching(userId, companyId, jdNumber, activeData);
                            setIsMatching(false);
                            if (result.success) {
                                Alert.alert('成功', 'マッチングを作成しました。');
                            } else {
                                Alert.alert('エラー', 'マッチングの作成に失敗しました。');
                            }
                        }
                    }
                ]
            );
        });
    };

    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const isReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        if (isReached && !isBottomReached) {
            setIsBottomReached(true);
        }
    };

    // Use firestore data if available, otherwise fallback to local data (context)
    const activeData = firestoreData || localData;
    const positionName = activeData['求人基本項目']?.['ポジション名'] || 'ポジション名未設定';

    return (
        <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {/* 1. Header Area - Cleaned up */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerActionContainer}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={onEdit}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={24} color={THEME.text} />
                            </TouchableOpacity>
                        </View>
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

                    {/* Content text to make it scrollable for demo */}
                    <View style={styles.descriptionTextContainer}>
                        <Text style={styles.descriptionTitle}>求人概要</Text>
                        <Text style={styles.descriptionText}>
                            私たちは、最新の技術スタックを用いて社会に貢献するプロダクトを開発しています。
                            ヒートマップで示されたスキルセットを持つエンジニアを募集しています。
                            詳細については、以下のボタンからお問い合わせください。
                            {"\n\n"}
                            【必須要件】
                            - 3年以上のWeb開発経験
                            - React/Next.jsを用いた開発の実務経験
                            - チームでの開発経験
                            {"\n\n"}
                            【歓迎要件】
                            - クラウドインフラの構築・運用経験
                            - 大規模サービスの開発・運用経験
                            {"\n\n"}
                            ※最下部までスクロールすると、面談・面接希望ボタンが有効になります。
                        </Text>
                    </View>

                    <View style={{ height: 200 }} />
                </ScrollView>

                {/* Floating Buttons */}
                <View style={styles.floatingActionContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.connectionButton]}
                        onPress={() => handleAction('connection')}
                    >
                        <Text style={styles.actionButtonText}>つながり希望</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.interviewButton, !isBottomReached && styles.disabledButton]}
                        onPress={() => handleAction('interview')}
                        disabled={!isBottomReached}
                    >
                        <Text style={styles.actionButtonText}>面談希望</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.formalButton, !isBottomReached && styles.disabledButton]}
                        onPress={() => handleAction('formal')}
                        disabled={!isBottomReached}
                    >
                        <Text style={styles.actionButtonText}>面接希望</Text>
                    </TouchableOpacity>
                </View>

                {isMatching && (
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                        <Text style={{ color: '#FFF', marginTop: 10 }}>処理中...</Text>
                    </View>
                )}
            </SafeAreaView>
            <BottomNav navigation={navigation} activeTab="Connection" />
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
    descriptionTextContainer: {
        padding: 20,
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: THEME.subText,
    },
    floatingActionContainer: {
        position: 'absolute',
        bottom: 100, // Moved up to avoid overlap with BottomNav
        right: 20,
        gap: 10,
        alignItems: 'flex-end',
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 140,
        alignItems: 'center',
    },
    connectionButton: {
        backgroundColor: '#3B82F6', // Blue
    },
    interviewButton: {
        backgroundColor: '#10B981', // Green
    },
    formalButton: {
        backgroundColor: THEME.accent, // Yellow
    },
    disabledButton: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 15,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
});
