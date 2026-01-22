import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { HeatmapGrid } from '@shared/src/core/components/HeatmapGrid';
import { GlassCard } from '@shared/src/core/components/GlassCard';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { HeatmapCalculator } from '@shared/src/core/utils/HeatmapCalculator';
import { BottomNav } from '../../core/components/BottomNav';

const { width, height } = Dimensions.get('window');

// Local custom generated rainforest background
const RAINFOREST_BG = require('../../../assets/generated/rainforest_bg.png');

export const IndividualProfileScreen = ({ route, userId: propUserId, userDoc: propUserDoc, hideSafeArea: propHideSafeArea = false, showBottomNav: propShowBottomNav = true }) => {
    const hideSafeArea = propHideSafeArea || route?.params?.hideSafeArea || false;
    const showBottomNav = propShowBottomNav && (route?.params?.showBottomNav !== false);
    const { data: localData } = useContext(DataContext);
    const navigation = useNavigation();

    // Resolve userId and initial userDoc from props or route params
    const userId = propUserId || route?.params?.userId || 'C000000000000';
    // If it's the current user (from context) and no specific user requested, use context data
    const isCurrentUser = userId === 'C000000000000';

    const [userDoc, setUserDoc] = useState(propUserDoc || route?.params?.userDoc || (isCurrentUser ? localData : null));
    const [remoteNames, setRemoteNames] = useState(null);
    const [remoteEmail, setRemoteEmail] = useState('');
    const [heatmapValues, setHeatmapValues] = useState(null);

    // Effect to fetch user data if not provided or to keep it updated
    useEffect(() => {
        // If we already have a userDoc passed via props/params, we might still want to listen for updates
        // especially if it's not the logged-in user.

        let unsubscribe = () => { };

        const fetchData = async () => {
            if (userId && !isCurrentUser) {
                const docRef = doc(db, 'individual', userId);
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const d = docSnap.data();
                        setUserDoc(d);

                        const b = d['基本情報'] || {};
                        const first = b['名'] || '';
                        const family = b['姓'] || '';
                        const mail = b['メール'] || '';

                        if (first || family) {
                            setRemoteNames({ first, family });
                        }
                        if (mail) {
                            setRemoteEmail(mail);
                        }

                        setHeatmapValues(HeatmapCalculator.calculate(d));
                    }
                });
            }
        };

        fetchData();
        return () => unsubscribe();
    }, [userId]);

    // Fallback: calculate heatmap from local context data when remote not yet available and it is current user
    useEffect(() => {
        if (!heatmapValues && userDoc) {
            const values = HeatmapCalculator.calculate(userDoc);
            setHeatmapValues(values);
        }
    }, [userDoc, heatmapValues]);

    const activeData = userDoc || {};
    const basicInfo = activeData['基本情報'] || {};

    // Names fallback
    const names = {
        first: basicInfo['First name(半角英)'] || '',
        family: basicInfo['Family name(半角英)'] || '',
        kanjiFirst: basicInfo['名'] || '',
        kanjiFamily: basicInfo['姓'] || '',
    };
    const email = basicInfo['メール'] || '';

    const handleEdit = () => {
        navigation.navigate('Registration', { isEdit: true, userDoc });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* 1. Header Background (Instruction: ~1/3 of screen height) */}
                <ImageBackground
                    source={basicInfo['背景画像URL'] ? { uri: basicInfo['背景画像URL'] } : RAINFOREST_BG}
                    style={styles.headerBackground}
                    imageStyle={{ opacity: 0.95 }}
                >
                    <View style={hideSafeArea ? { paddingTop: 20, flex: 1 } : { flex: 1 }}>
                        {hideSafeArea ? (
                            <View style={styles.headerSafeArea}>
                                <View style={styles.topProfileContainer}>
                                    {/* Header Action Buttons (Notifications and Image Edit) */}
                                    <View style={styles.headerActionContainer}>
                                        <TouchableOpacity style={styles.headerIconButton} onPress={() => console.log('Notifications')}>
                                            <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('ImageEdit', { userDoc })}>
                                            <Ionicons name="create-outline" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* 2. Top-right repositioned button */}
                                    <View style={styles.profileActionRow}>
                                        <TouchableOpacity style={styles.miniResumeButton}>
                                            <Text style={styles.miniResumeButtonText}>職歴書作成</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* 3. Profile Row directly below the button */}
                                    <View style={styles.profileRow}>
                                        <View style={styles.photoContainer}>
                                            <Image
                                                source={{ uri: basicInfo['プロフィール画像URL'] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' }}
                                                style={styles.profileImage}
                                            />
                                        </View>
                                        <View style={styles.namePlate}>
                                            <Text style={styles.nameText}>{String(remoteNames?.family || names.kanjiFamily)} {String(remoteNames?.first || names.kanjiFirst)}</Text>
                                            <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                            <Text style={styles.emailText}>{String(remoteEmail || email)}</Text>
                                            <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                            {/* Relocated Chatbot button */}
                                            <TouchableOpacity style={styles.chatBotCalloutOverlap}>
                                                <Ionicons name="chatbubble-ellipses" size={30} color={THEME.accent} />
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
                                        <TouchableOpacity style={styles.headerIconButton} onPress={() => console.log('Notifications')}>
                                            <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('ImageEdit', { userDoc })}>
                                            <Ionicons name="create-outline" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* 2. Top-right repositioned button */}
                                    <View style={styles.profileActionRow}>
                                        <TouchableOpacity style={styles.miniResumeButton}>
                                            <Text style={styles.miniResumeButtonText}>職歴書作成</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* 3. Profile Row directly below the button */}
                                    <View style={styles.profileRow}>
                                        <View style={styles.photoContainer}>
                                            <Image
                                                source={{ uri: basicInfo['プロフィール画像URL'] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' }}
                                                style={styles.profileImage}
                                            />
                                        </View>
                                        <View style={styles.namePlate}>
                                            <Text style={styles.nameText}>{String(remoteNames?.family || names.kanjiFamily)} {String(remoteNames?.first || names.kanjiFirst)}</Text>
                                            <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                            <Text style={styles.emailText}>{String(remoteEmail || email)}</Text>
                                            <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>

                                            {/* Relocated Chatbot button */}
                                            <TouchableOpacity style={styles.chatBotCalloutOverlap}>
                                                <Ionicons name="chatbubble-ellipses" size={30} color={THEME.accent} />
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
                <View style={styles.badgeSection} testID="skill_badge_section">
                    <View style={styles.tradingCardRow}>
                        {['コアスキル', 'サブスキル1', 'サブスキル2'].map((label, index) => {
                            const skills = ['サーバサイド', 'iOS', 'AWS'];
                            return (
                                <GlassCard
                                    key={index}
                                    label={label}
                                    skillName={skills[index]}
                                    iconName={index === 0 ? "star" : index === 1 ? "medal" : "trophy"}
                                    width={(width * 0.75) / 3.2} // Responsive width
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

                    <HeatmapGrid containerWidth={width - 40} dataValues={heatmapValues} testID="skill_heatmap" />

                    <View style={styles.chatBotCallout} testID="chatbot_button">
                        <Ionicons name="chatbubble-ellipses" size={40} color={THEME.accent} />
                        <Text style={styles.labelYellow}>チャットボット</Text>
                    </View>
                </View>

                {/* Whitespace buffer before footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            {showBottomNav && (
                <>
                    <BottomNav navigation={navigation} activeTab="Home" userDoc={userDoc} />

                    {/* 6. Renamed button + chevron */}
                    <View style={styles.bottomNavCenterOverlay} pointerEvents="box-none">
                        <TouchableOpacity style={styles.centerButton} testID="career_detail_button">
                            <Text style={styles.centerButtonText}>経歴詳細</Text>
                            <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                        </TouchableOpacity>
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
        height: height * 0.45, // Target 40-45% height
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
    chatBotCallout: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        alignItems: 'center',
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