import React, { useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { HeatmapGrid } from '@shared/src/features/analytics/components/HeatmapGrid';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { HeatmapCalculator } from '@shared/src/features/analytics/utils/HeatmapCalculator';
import { User } from '@shared/src/core/models/User';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { IconButton } from '@shared/src/core/components/IconButton';
import { useFirestoreSnapshot } from '@shared/src/core/utils/useFirestore';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { SYSTEM_USER_ID } from '@shared/src/core/constants';

const { width, height } = Dimensions.get('window');

// Local custom generated rainforest background
const RAINFOREST_BG = require('@shared/assets/generated/rainforest_bg.png');

/**
 * @typedef {Object} IndividualProfileScreenProps
 * @property {Object} route
 * @property {Object} [route.params]
 * @property {string} [route.params.userId]
 * @property {Object} [route.params.userDoc]
 * @property {boolean} [route.params.hideSafeArea]
 * @property {boolean} [route.params.showBottomNav]
 * @property {string} [userId]
 * @property {Object} [userDoc]
 * @property {boolean} [hideSafeArea]
 * @property {boolean} [showBottomNav]
 */

/**
 * Individual Profile Screen
 * Displays the profile of an individual engineer.
 * 
 * @param {IndividualProfileScreenProps} props
 * @param {Object} props.route - Route object
 * @param {string} [props.userId] - User ID
 * @param {Object} [props.userDoc] - User Document
 * @param {boolean} [props.hideSafeArea] - Hide Safe Area
 * @param {boolean} [props.showBottomNav] - Show Bottom Nav
 */
export const IndividualProfileScreen = ({ route, userId: propUserId, userDoc: propUserDoc, hideSafeArea: propHideSafeArea = false, showBottomNav: propShowBottomNav = true }) => {
    const hideSafeArea = propHideSafeArea || route?.params?.hideSafeArea || false;
    // Simplify showBottomNav logic to rely more on prop
    const showBottomNav = propShowBottomNav;
    const { data: localData } = useContext(DataContext);
    const navigation = useNavigation();

    // Resolve userId and initial userDoc from props or route params
    const userId = propUserId || route?.params?.userId || SYSTEM_USER_ID;
    // If it's the current user (from context) and no specific user requested, use context data
    const isCurrentUser = userId === SYSTEM_USER_ID;

    // Use useFirestoreSnapshot for real-time updates when it's not the current user in local data
    // SKIP snapshot if propUserDoc is provided (e.g. from Admin Modal with full data) to prevent overwriting with partial public data
    const docRef = useMemo(() => {
        if (propUserDoc) return null;
        return (!isCurrentUser && userId ? doc(db, 'public_profile', userId) : null);
    }, [userId, isCurrentUser, propUserDoc]);
    
    const { data: remoteUserDoc, loading: remoteLoading } = useFirestoreSnapshot(docRef, User);

    const [userDoc, setUserDoc] = useState(propUserDoc || route?.params?.userDoc || (isCurrentUser ? localData : remoteUserDoc));
    const [heatmapValues, setHeatmapValues] = useState(null);

    const [containerWidth, setContainerWidth] = useState(width);

    // Update userDoc when remote data changes
    useEffect(() => {
        if (remoteUserDoc) setUserDoc(remoteUserDoc);
    }, [remoteUserDoc]);

    // Ensure we have a User model instance (handles hydration from nav params if needed)
    const user = userDoc instanceof User ? userDoc : User.fromFirestore(userId, userDoc);

    // Fallback: calculate heatmap from local context data when remote not yet available and it is current user
    useEffect(() => {
        if (!heatmapValues && userDoc) {
            const values = HeatmapCalculator.calculate(userDoc);
            setHeatmapValues(values);
        }
    }, [userDoc, heatmapValues]);

    /**
     * Navigates to the registration/edit screen.
     */
    const handleEdit = () => {
        navigation.navigate(ROUTES.REGISTRATION, { isEdit: true, userDoc });
    };

    return (
        <View style={styles.container} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            <ScrollView
                style={styles.mainScrollView}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* 1. Header Background (Instruction: ~1/3 of screen height) */}
                <ImageBackground
                    source={user.backgroundImageUrl ? { uri: user.backgroundImageUrl } : RAINFOREST_BG}
                    style={styles.headerBackground}
                    imageStyle={{ opacity: 0.95 }}
                >
                    <View style={hideSafeArea ? { paddingTop: 20, flex: 1 } : { flex: 1 }}>
                        {hideSafeArea ? (
                            <View style={styles.headerSafeArea}>
                                <View style={styles.topProfileContainer}>
                                    {/* Header Action Buttons (Notifications and Image Edit) */}
                                    <View style={styles.headerActionContainer}>
                                        <IconButton
                                            name='notifications-outline'
                                            size={24}
                                            color='#FFF'
                                            style={styles.headerIconButton}
                                            onPress={() => console.log('Notifications')}
                                        />
                                        <IconButton
                                            name='create-outline'
                                            size={24}
                                            color='#FFF'
                                            style={styles.headerIconButton}
                                            onPress={() => navigation.navigate(ROUTES.IMAGE_EDIT, { userDoc })}
                                        />
                                    </View>

                                    {/* 2. Top-right repositioned button */}
                                    <View style={styles.profileActionRow}>
                                        <TouchableOpacity style={styles.miniResumeButton} testID='create_resume_button'>
                                            <Text style={styles.miniResumeButtonText}>職歴書作成</Text>
                                        </TouchableOpacity>
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
                                            <Text style={styles.nameText} testID='user_full_name'>{user.fullNameKanji}</Text>
                                            <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                            <Text style={styles.emailText}>{user.email}</Text>
                                            <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                            {/* Relocated Chatbot button */}
                                            <TouchableOpacity style={styles.chatBotCalloutOverlap}>
                                                <Ionicons name='chatbubble-ellipses' size={30} color={THEME.accent} />
                                                <Text style={styles.labelYellow}>チャット</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                                <View style={styles.topProfileContainer}>
                                    {/* Header Action Buttons (Notifications and Image Edit) */}
                                    <View style={styles.headerActionContainer}>
                                        <IconButton
                                            name='notifications-outline'
                                            size={24}
                                            color='#FFF'
                                            style={styles.headerIconButton}
                                            onPress={() => console.log('Notifications')}
                                        />
                                        <IconButton
                                            name='create-outline'
                                            size={24}
                                            color='#FFF'
                                            style={styles.headerIconButton}
                                            onPress={() => navigation.navigate(ROUTES.IMAGE_EDIT, { userDoc })}
                                        />
                                    </View>

                                    {/* 2. Top-right repositioned button */}
                                    <View style={styles.profileActionRow}>
                                        <TouchableOpacity style={styles.miniResumeButton} testID='create_resume_button'>
                                            <Text style={styles.miniResumeButtonText}>職歴書作成</Text>
                                        </TouchableOpacity>
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
                                            <Text style={styles.nameText} testID='user_full_name'>{user.fullNameKanji}</Text>
                                            <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                            <Text style={styles.emailText}>{user.email}</Text>
                                            <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                            {/* Relocated Chatbot button */}
                                            <TouchableOpacity style={styles.chatBotCalloutOverlap}>
                                                <Ionicons name='chatbubble-ellipses' size={30} color={THEME.accent} />
                                                <Text style={styles.labelYellow}>チャット</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </SafeAreaView>
                        )}
                    </View>
                </ImageBackground>

                {/* 4. Glassmorphism Badges (Moved up, fully transparent) */}
                <View style={styles.badgeSection} testID='skill_badge_section'>
                    <View style={styles.tradingCardRow}>
                        {['コアスキル', 'サブスキル1', 'サブスキル2'].map((label, index) => {
                            const skills = ['サーバサイド', 'iOS', 'AWS'];
                            return (
                                <GlassCard
                                    key={index}
                                    label={label}
                                    skillName={skills[index]}
                                    iconName={index === 0 ? 'star' : index === 1 ? 'medal' : 'trophy'}
                                    width={(containerWidth - 40) / 3.2} // Responsive width
                                    labelStyle={styles.cardLabel}
                                    badgeStyle={styles.glassBadge}
                                    skillNameStyle={styles.cardSkillName}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* 5. Heatmap Section (Visible Grid) */}
                <View style={styles.heatmapSection} testID='skill_heatmap'>
                    <View style={styles.heatmapHeader}>
                        <Text style={styles.heatmapTitle}>スキル・志向ヒートマップ</Text>
                        <View style={styles.chatBotIconSmall}>
                            <Ionicons name='chatbubble-outline' size={14} color={THEME.text} />
                        </View>
                    </View>

                    <HeatmapGrid containerWidth={containerWidth - 40} dataValues={heatmapValues} testID='skill_heatmap' />

                    <View style={styles.chatBotCallout} testID='chatbot_button'>
                        <Ionicons name='chatbubble-ellipses' size={40} color={THEME.accent} />
                        <Text style={styles.labelYellow}>チャットボット</Text>
                    </View>
                </View>

                {/* Whitespace buffer before footer */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* 6. Footer Navigation (Optional) */}
            {showBottomNav && (
                <View style={styles.footerContainer} testID='profile_footer'>
                    <BottomNav navigation={navigation} activeTab='Home' userDoc={userDoc} />
                </View>
            )}

            {/* 7. Center Overlay Button (e.g. 'Career Detail' or 'Chat') */}
            {showBottomNav && (
                <View style={styles.bottomNavCenterOverlay} pointerEvents='box-none'>
                    <TouchableOpacity
                        style={styles.centerButton}
                        onPress={() => navigation.navigate(ROUTES.REGISTRATION, { isEdit: true, userDoc })}
                    >
                        <Text style={styles.centerButtonText}>経歴詳細</Text>
                        <Ionicons name='create-outline' size={18} color='#FFF' style={{ marginTop: -2 }} />
                    </TouchableOpacity>
                </View>
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
        paddingBottom: 150, // Space for fixed footer
        flexGrow: 1,
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
    miniResumeButton: {
        backgroundColor: THEME.success,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    miniResumeButtonText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
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
        shadowColor: '#000',
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
        marginTop: -40, // Reduced pull-up to prevent clipping
        paddingHorizontal: 10,
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
        justifyContent: 'flex-start',
        marginTop: 10,
        zIndex: 10, // Ensure tooltips show above other elements
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    labelYellow: {
        color: THEME.accent,
    },
    chatBotCallout: {
        position: 'absolute',
        bottom: -10,
        right: 0,
        alignItems: 'center',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    bottomNavCenterOverlay: {
        position: 'absolute',
        bottom: 30, // Adjust to overlap BottomNav correctly
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 101,
    },
    centerButton: {
        backgroundColor: THEME.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    centerButtonText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 2,
    }
});
