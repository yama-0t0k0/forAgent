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
import registrationService from '@shared/src/features/registration/services/registrationService';
import { HeatmapCalculator } from '@shared/src/features/analytics/utils/HeatmapCalculator';
import { User } from '@shared/src/core/models/User';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { IconButton } from '@shared/src/core/components/IconButton';
import { NotificationBell } from '@shared/src/core/components/NotificationBell';
import { NotificationListModal } from '@shared/src/features/notification/components/NotificationListModal';
import { NotificationService } from '@shared/src/features/notification/services/NotificationService';
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
    const [registrationDraft, setRegistrationDraft] = useState(null);
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);

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

    // Check for registration drafts if eligible
    useEffect(() => {
        /**
         * @returns {Promise<void>}
         */
        const checkDraft = async () => {
            if (isCurrentUser && user.canCreateCompany && !user.isCorporateMember()) {
                const draft = await registrationService.getRegistrationDraft(user.uid);
                setRegistrationDraft(draft);
            }
        };
        checkDraft();
    }, [isCurrentUser, user.canCreateCompany, user.uid, user.role, user.allowedCompanies]);

    // Fetch notifications for the current user
    /**
     * @returns {Promise<void>}
     */
    const fetchNotifications = async () => {
        if (isCurrentUser) {
            try {
                const data = await NotificationService.fetchNotifications(user.uid);
                setNotifications(data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isCurrentUser, user.uid]);

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
                                        <NotificationBell
                                            uid={user.uid}
                                            onPress={() => setIsNotificationVisible(true)}
                                            style={styles.headerIconButton}
                                        />
                                        <IconButton
                                            name='create-outline'
                                            size={24}
                                            color={THEME.textInverse}
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
                                            <Text style={styles.emailText} testID='user_email'>{user.email}</Text>
                                            <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                            {/* Relocated Chatbot button */}
                                            <TouchableOpacity style={styles.chatBotCalloutOverlap}>
                                                <Ionicons name='chatbubble-ellipses' size={30} color={THEME.primary} />
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
                                        <NotificationBell
                                            uid={user.uid}
                                            onPress={() => setIsNotificationVisible(true)}
                                            style={styles.headerIconButton}
                                        />
                                        <IconButton
                                            name='create-outline'
                                            size={24}
                                            color={THEME.textInverse}
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
                                            <Text style={styles.emailText} testID='user_email'>{user.email}</Text>
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
                    {/* Hybrid Onboarding Banner */}
                    {registrationDraft && (
                        <TouchableOpacity 
                            style={styles.draftBanner}
                            onPress={() => navigation.navigate(ROUTES.REGISTRATION, { 
                                type: 'corporate', 
                                resumeData: registrationDraft.formData 
                            })}
                        >
                            <Ionicons name='time-outline' size={20} color={THEME.textInverse} />
                            <Text style={styles.draftBannerText}>法人登録を再開する</Text>
                            <Ionicons name='chevron-forward' size={16} color={THEME.textInverse} />
                        </TouchableOpacity>
                    )}

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
                            <Ionicons name='chatbubble-outline' size={14} color={THEME.textPrimary} />
                        </View>
                    </View>

                    <HeatmapGrid containerWidth={containerWidth - 40} dataValues={heatmapValues} testID='skill_heatmap' />

                    <View style={styles.chatBotCallout} testID='chatbot_button'>
                        <Ionicons name='chatbubble-ellipses' size={40} color={THEME.primary} />
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
                <View style={[styles.bottomNavCenterOverlay, { gap: 15 }]} pointerEvents='box-none'>
                    {user.canCreateCompany && !user.isCorporateMember() && (
                        <TouchableOpacity
                            style={[styles.centerButton, { backgroundColor: THEME.success }]}
                            onPress={() => navigation.navigate(ROUTES.REGISTRATION, { type: 'corporate' })}
                            testID='corporate_registration_button'
                        >
                            <Text style={styles.centerButtonText}>法人登録</Text>
                            <Ionicons name='business-outline' size={18} color={THEME.textInverse} style={{ marginTop: -2 }} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.centerButton}
                        onPress={() => navigation.navigate(ROUTES.REGISTRATION, { isEdit: true, userDoc })}
                        testID='career_detail_button'
                    >
                        <Text style={styles.centerButtonText}>経歴詳細</Text>
                        <Ionicons name='create-outline' size={18} color={THEME.textInverse} style={{ marginTop: -2 }} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Notification List Overlay */}
            <NotificationListModal
                visible={isNotificationVisible}
                uid={user.uid}
                onClose={() => setIsNotificationVisible(false)}
                notifications={notifications}
                onRefresh={fetchNotifications}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    dataSourceText: {
        ...THEME.typography.micro,
        color: THEME.textSecondary,
        marginTop: THEME.spacing.xs,
    },
    scrollContent: {
        paddingBottom: 150,
        flexGrow: 1,
    },
    headerBackground: {
        width: '100%',
        height: height * 0.35,
        justifyContent: 'flex-start',
    },
    headerSafeArea: {
        flex: 1,
    },
    topProfileContainer: {
        paddingHorizontal: THEME.spacing.md,
        paddingTop: THEME.spacing.xs,
        width: '100%',
    },
    headerActionContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-end', 
        gap: THEME.spacing.sm,
    },
    headerIconButton: {
        marginBottom: THEME.spacing.xs,
        backgroundColor: THEME.surfaceGlass,
        borderRadius: THEME.radius.full,
        padding: THEME.spacing.xs,
    },
    profileActionRow: {
        marginBottom: THEME.spacing.xs,
        flexDirection: 'row', 
        justifyContent: 'flex-end',
        width: '100%',
    },
    miniResumeButton: {
        backgroundColor: THEME.success,
        paddingVertical: THEME.spacing.xs,
        paddingHorizontal: THEME.spacing.sm,
        borderRadius: THEME.radius.pill,
    },
    miniResumeButtonText: {
        color: THEME.textInverse,
        ...THEME.typography.small, 
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
        borderRadius: THEME.radius.lg,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: THEME.surface,
        marginRight: THEME.spacing.sm,
        backgroundColor: THEME.surfaceInput,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    namePlate: {
        flex: 2,
        justifyContent: 'center',
        backgroundColor: THEME.surfaceElevated,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        minHeight: 100,
        ...THEME.shadow.sm,
        position: 'relative',
    },
    nameText: {
        ...THEME.typography.h3,
        color: THEME.textPrimary,
        marginBottom: 2,
    },
    jobTitle: {
        ...THEME.typography.small,
        color: THEME.primary,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    emailText: {
        ...THEME.typography.micro,
        color: THEME.textSecondary,
    },
    badgeSection: {
        marginTop: -40,
        paddingHorizontal: THEME.spacing.sm,
        marginBottom: THEME.spacing.sm,
    },
    tradingCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLabel: {
        color: THEME.textInverse,
        ...THEME.typography.micro,
        fontWeight: '800', 
        marginBottom: THEME.spacing.xs,
        textShadowColor: THEME.shadowColor,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    glassBadge: {
        width: '100%',
        aspectRatio: 1.1,
        borderRadius: THEME.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.chartLevel1,
        borderWidth: 1.5,
        borderColor: THEME.borderGlass,
    },
    cardSkillName: {
        color: THEME.textInverse,
        ...THEME.typography.micro,
        fontWeight: '800', 
        marginBottom: 2,
        textAlign: 'center',
        paddingHorizontal: 4,
        textShadowColor: THEME.shadowColor,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    heatmapSection: {
        paddingHorizontal: THEME.spacing.md,
        justifyContent: 'flex-start',
        marginTop: THEME.spacing.md,
        zIndex: 10,
    },
    heatmapHeader: {
        flexDirection: 'row',
        alignItems: 'center', 
        alignSelf: 'flex-start',
        marginBottom: THEME.spacing.sm,
    },
    heatmapTitle: {
        color: THEME.textPrimary,
        ...THEME.typography.h3,
        marginRight: THEME.spacing.sm,
    },
    chatBotIconSmall: {
        backgroundColor: THEME.borderDefault, 
        padding: 3,
        borderRadius: THEME.radius.sm,
    },
    chatBotCalloutOverlap: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        alignItems: 'center',
        backgroundColor: THEME.surfaceElevated,
        padding: THEME.spacing.xs,
        borderRadius: THEME.radius.lg,
        ...THEME.shadow.sm,
    },
    labelYellow: {
        color: THEME.primary,
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
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
    },
    draftBanner: {
        backgroundColor: THEME.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: THEME.spacing.sm,
        paddingHorizontal: THEME.spacing.md,
        borderRadius: THEME.radius.lg,
        marginBottom: THEME.spacing.md,
        gap: THEME.spacing.sm,
        ...THEME.shadow.md,
    },
    draftBannerText: {
        flex: 1,
        color: THEME.textInverse,
        fontWeight: 'bold',
        ...THEME.typography.bodySmall,
    },
    centerButton: {
        backgroundColor: THEME.primary,
        width: 60,
        height: 60,
        borderRadius: THEME.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadow.md,
        borderWidth: 3,
        borderColor: THEME.surface,
    },
    centerButtonText: {
        color: THEME.textInverse,
        ...THEME.typography.micro,
        fontWeight: 'bold',
        marginBottom: 2,
    }
});
