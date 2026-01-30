import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, ImageBackground } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { HeatmapGrid } from '@shared/src/features/analytics/components/HeatmapGrid';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { PrimaryButton } from '@shared/src/core/components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { HeatmapCalculator } from '@shared/src/features/analytics/utils/HeatmapCalculator';
import { User } from '@shared/src/core/models/User';
import { IconButton } from '@shared/src/core/components/IconButton';

const { width, height } = Dimensions.get('window');

// Local custom generated rainforest background
const RAINFOREST_BG = require('@assets/generated/rainforest_bg.png');

/**
 * @typedef {Object} MyPageScreenProps
 * @property {string} [userId] - User ID (optional, for Admin App)
 * @property {Object} [userDoc] - User Data Document (optional, for Admin App)
 * @property {boolean} [hideSafeArea] - Whether to hide SafeAreaView (optional, for Modal)
 */

/**
 * MyPage Screen Component
 * Displays individual user profile including heatmap and personal info.
 * Can be used in both Individual App (standalone) and Admin App (modal).
 * 
 * @param {MyPageScreenProps} props
 */
export const MyPageScreen = (props) => {
    const { userId: propUserId, userDoc: propUserDoc, hideSafeArea } = props;
    const { data } = useContext(DataContext);
    const navigation = useNavigation();
    const [fetchedData, setFetchedData] = useState(null);
    const [heatmapValues, setHeatmapValues] = useState(null);

    // Use fetched data if available, otherwise prop data, otherwise Context data
    const displayData = fetchedData || propUserDoc || data;
    const targetUserId = propUserId || 'C000000000000';

    // Create User model instance
    const user = User.fromFirestore(targetUserId, displayData);

    useEffect(() => {
        /**
         * Fetches user data from Firestore if not provided via props.
         */
        const fetchRemoteData = async () => {
            try {
                // If propUserDoc is provided, we don't need to fetch unless it's incomplete
                if (propUserDoc) {
                    const values = HeatmapCalculator.calculate(propUserDoc);
                    setHeatmapValues(values);
                    return;
                }

                const snap = await getDoc(doc(db, 'individual', targetUserId));
                if (snap.exists()) {
                    const d = snap.data();
                    console.log('remote data fetched');
                    setFetchedData(d);

                    const values = HeatmapCalculator.calculate(d);
                    setHeatmapValues(values);
                }
            } catch (e) {
                console.log('failed to fetch remote data', e);
            }
        };
        fetchRemoteData();
    }, [targetUserId, propUserDoc]);

    // Fallback: calculate heatmap from local context data when remote not yet available
    useEffect(() => {
        if (!heatmapValues && displayData) {
            const values = HeatmapCalculator.calculate(displayData);
            setHeatmapValues(values);
        }
    }, [displayData, heatmapValues]);
    // Heatmap grid logic moved to HeatmapGrid component

    /**
     * Navigates to registration screen in edit mode.
     */
    const handleEdit = () => {
        navigation.navigate('Registration', { isEdit: true });
    };

    const SafeAreaComponent = hideSafeArea ? View : SafeAreaView;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* 1. Header Background (Instruction: ~1/3 of screen height) */}
                <ImageBackground
                    source={user.backgroundImageUrl ? { uri: user.backgroundImageUrl } : RAINFOREST_BG}
                    style={styles.headerBackground}
                    imageStyle={{ opacity: 0.95 }}
                >
                    <SafeAreaComponent edges={['top']} style={styles.headerSafeArea}>
                        <View style={styles.topProfileContainer}>
                            {/* Header Action Buttons (Notifications and Image Edit) */}
                            <View style={styles.headerActionContainer}>
                                <IconButton
                                    name="notifications-outline"
                                    size={24}
                                    color="#FFF"
                                    style={styles.headerIconButton}
                                    onPress={() => console.log('Notifications')}
                                />
                                <IconButton
                                    name="create-outline"
                                    size={24}
                                    color="#FFF"
                                    style={styles.headerIconButton}
                                    onPress={() => navigation.navigate('ImageEdit')}
                                />
                            </View>

                            {/* 2. Top-right repositioned button */}
                            <View style={styles.profileActionRow}>
                                <PrimaryButton
                                    title="職歴書作成"
                                    variant="small"
                                    style={{ backgroundColor: THEME.success }}
                                    onPress={() => { }}
                                />
                            </View>

                            {/* 3. Profile Row directly below the button */}
                            <View style={styles.profileRow}>
                                <View style={styles.photoContainer}>
                                    <Image
                                        source={{ uri: user.profileImageUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' }}
                                        style={styles.profileImage}
                                    />
                                </View>
                                <View style={styles.namePlate}>
                                    <Text style={styles.nameText}>{user.fullNameKanji}</Text>
                                    <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                    <Text style={styles.emailText}>{user.email}</Text>
                                    <Text style={styles.dataSourceText}>{String(fetchedData || propUserDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                    {/* Relocated Chatbot button */}
                                    <IconButton style={styles.chatBotCalloutOverlap}>
                                        <Ionicons name="chatbubble-ellipses" size={30} color={THEME.accent} />
                                        <Text style={styles.labelYellow}>チャット</Text>
                                    </IconButton>
                                </View>
                            </View>
                        </View>
                    </SafeAreaComponent>
                </ImageBackground>

                {/* 4. Glassmorphism Badges (Moved up, fully transparent) */}
                <View style={styles.badgeSection}>
                    <View style={styles.tradingCardRow}>
                        {['コアスキル', 'サブスキル1', 'サブスキル2'].map((label, index) => {
                            const skills = ['サーバサイド', 'iOS', 'AWS'];
                            return (
                                <GlassCard
                                    key={index}
                                    label={label}
                                    skillName={skills[index]}
                                    iconName={index === 0 ? "star" : index === 1 ? "medal" : "trophy"}
                                    width={(width - 45) / 3}
                                    labelStyle={styles.cardLabel}
                                    badgeStyle={styles.glassBadge}
                                    skillNameStyle={styles.cardSkillName}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* 5. Heatmap Section (40% height, Visible Grid) */}
                <View style={styles.heatmapSection}>
                    <View style={styles.heatmapHeader}>
                        <Text style={styles.heatmapTitle}>スキル・志向ヒートマップ</Text>
                        <View style={styles.chatBotIconSmall}>
                            <Ionicons name="chatbubble-outline" size={14} color={THEME.text} />
                        </View>
                    </View>

                    <HeatmapGrid containerWidth={width - 40} dataValues={heatmapValues} />

                    <View style={styles.chatBotCallout}>
                        <Ionicons name="chatbubble-ellipses" size={40} color={THEME.accent} />
                        <Text style={styles.labelYellow}>チャットボット</Text>
                    </View>
                </View>

                {/* Whitespace buffer before footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* 5. Custom Bottom Navigation (Footer) - Only for Main Screen (not modal) */}
            {!hideSafeArea && (
                <>
                    <View style={styles.bottomNav}>
                        <BottomNavItem
                            label="キャリア"
                            icon="briefcase-outline"
                            onPress={() => navigation.navigate('Career')}
                            style={styles.navItem}
                        />
                        <BottomNavItem
                            label="つながり"
                            icon="people-circle-outline"
                            onPress={() => navigation.navigate('Connection')}
                            style={styles.navItem}
                        />
                        <BottomNavItem
                            label="ホーム"
                            icon="home"
                            isActive={true}
                            onPress={() => navigation.navigate('MyPage')}
                            style={styles.navItem}
                        />
                        <BottomNavItem
                            label="学習"
                            icon="book-outline"
                            style={styles.navItem}
                        />
                        <BottomNavItem
                            label="メニュー"
                            icon="grid-outline"
                            onPress={() => navigation.navigate('Menu')}
                            style={styles.navItem}
                        />
                    </View>

                    {/* 6. Renamed button + chevron */}
                    <View style={styles.bottomNavCenterOverlay}>
                        <PrimaryButton
                            style={styles.centerButton}
                            onPress={() => { }}
                        >
                            <Text style={styles.centerButtonText}>経歴詳細</Text>
                            <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                        </PrimaryButton>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    dataSourceText: {
        fontSize: 10,
        color: THEME.subText,
        marginTop: 2,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    headerBackground: {
        width: '100%',
        height: height * 0.35, // 1/3 height as requested
        justifyContent: 'flex-start',
    },
    headerSafeArea: {
        flex: 1,
    },
    topProfileContainer: {
        paddingHorizontal: 15,
        paddingTop: 5,
        width: '100%',
    },
    headerActionContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        gap: 10,
    },
    headerIconButton: {
        marginBottom: 2,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 15,
        padding: 4,
    },
    profileActionRow: {
        marginBottom: 5,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    photoContainer: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFF',
        marginRight: 10,
        backgroundColor: '#EEE',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    namePlate: {
        flex: 2,
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        minHeight: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative', // For absolute positioning of chatbot
    },
    nameText: {
        fontSize: 17,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 2,
    },
    jobTitle: {
        fontSize: 11,
        color: THEME.accent,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    emailText: {
        fontSize: 9,
        color: THEME.subText,
    },
    badgeSection: {
        marginTop: -50, // Pull up due to shorter header
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    tradingCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    glassBadge: {
        width: '100%',
        aspectRatio: 1.1,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(186, 230, 253, 0.75)', // Light blue semi-transparent
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    cardSkillName: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 2,
        textAlign: 'center',
        paddingHorizontal: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    heatmapSection: {
        paddingHorizontal: 15,
        height: height * 0.45, // Target 40-45% height
        justifyContent: 'flex-start',
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
    chatBotCalloutOverlap: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        padding: 5,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    labelYellow: {
        color: THEME.accent,
        fontSize: 9,
        fontWeight: '800',
        marginTop: -2,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        height: 75,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 15,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    bottomNavCenterOverlay: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        zIndex: 20,
    },
    centerButton: {
        backgroundColor: THEME.success,
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: THEME.cardBg,
        alignItems: 'center',
        flexDirection: 'column',
    },
    centerButtonText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 15,
    },
});
