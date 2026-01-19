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
const RAINFOREST_BG = require('../../../assets/generated/rainforest_bg.png');

export const IndividualProfileScreen = ({ route }) => {
    const { data: localData } = useContext(DataContext);
    const navigation = useNavigation();

    // Resolve userId and initial userDoc from route params
    const userId = route?.params?.userId || 'C000000000000';
    const [userDoc, setUserDoc] = useState(route?.params?.userDoc || null);
    const [heatmapValues, setHeatmapValues] = useState(null);

    useEffect(() => {
        // Real-time listener for user data
        const docRef = doc(db, 'individual', userId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const d = docSnap.data();
                setUserDoc(d);
                setHeatmapValues(HeatmapCalculator.calculate(d));
            }
        });
        return () => unsubscribe();
    }, [userId]);

    // Fallback to local data if firestore not yet loaded
    const activeData = userDoc || localData;
    const basicInfo = activeData['基本情報'] || {};
    const names = {
        kanjiFirst: basicInfo['名'] || '',
        kanjiFamily: basicInfo['姓'] || '',
    };
    const email = basicInfo['メール'] || '';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <ImageBackground
                    source={basicInfo['背景画像URL'] ? { uri: basicInfo['背景画像URL'] } : RAINFOREST_BG}
                    style={styles.headerBackground}
                    imageStyle={{ opacity: 0.95 }}
                >
                    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                        <View style={styles.topProfileContainer}>
                            <View style={styles.headerActionContainer}>
                                <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('ImageEdit')}>
                                    <Ionicons name="create-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.profileRow}>
                                <View style={styles.photoContainer}>
                                    <Image
                                        source={{ uri: basicInfo['プロフィール画像URL'] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400' }}
                                        style={styles.profileImage}
                                    />
                                </View>
                                <View style={styles.namePlate}>
                                    <Text style={styles.nameText}>{String(basicInfo['姓'] || '')} {String(basicInfo['名'] || '')}</Text>
                                    <Text style={styles.jobTitle}>フロントエンドエンジニア</Text>
                                    <Text style={styles.emailText}>{String(email)}</Text>
                                    <Text style={styles.dataSourceText}>{String(userDoc ? 'データ元: Firestore' : 'データ元: テンプレート')}</Text>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </ImageBackground>

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
                                />
                            );
                        })}
                    </View>
                </View>

                <View style={styles.heatmapSection}>
                    <View style={styles.heatmapHeader}>
                        <Text style={styles.heatmapTitle}>スキル・志向ヒートマップ</Text>
                    </View>
                    <HeatmapGrid containerWidth={width - 40} dataValues={heatmapValues} />
                </View>

                <View style={{ height: 150 }} />
            </ScrollView>

            <BottomNav navigation={navigation} activeTab="Home" />

            <View style={styles.bottomNavCenterOverlay}>
                <TouchableOpacity style={styles.centerButton}>
                    <Text style={styles.centerButtonText}>経歴詳細</Text>
                    <Ionicons name="chevron-down" size={20} color="#FFF" style={{ marginTop: -2 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    scrollContent: { paddingBottom: 0 },
    headerBackground: { width: '100%', height: height * 0.35 },
    headerSafeArea: { flex: 1 },
    topProfileContainer: { paddingHorizontal: 15, paddingTop: 5, width: '100%' },
    headerActionContainer: { flexDirection: 'row', alignSelf: 'flex-end', gap: 10 },
    headerIconButton: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 15, padding: 4 },
    profileRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 20 },
    photoContainer: { flex: 1, aspectRatio: 1, borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', marginRight: 10, backgroundColor: '#EEE' },
    profileImage: { width: '100%', height: '100%' },
    namePlate: { flex: 2, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: THEME.cardBorder, minHeight: 100 },
    nameText: { fontSize: 17, fontWeight: '800', color: THEME.text },
    jobTitle: { fontSize: 11, color: THEME.accent, fontWeight: 'bold' },
    emailText: { fontSize: 9, color: THEME.subText },
    dataSourceText: { fontSize: 10, color: THEME.subText, marginTop: 2 },
    badgeSection: { marginTop: -50, paddingHorizontal: 15, marginBottom: 10 },
    tradingCardRow: { flexDirection: 'row', justifyContent: 'space-between' },
    heatmapSection: { paddingHorizontal: 15, marginTop: 10 },
    heatmapHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    heatmapTitle: { color: THEME.text, fontSize: 16, fontWeight: '800' },
    bottomNavCenterOverlay: { position: 'absolute', bottom: 85, alignSelf: 'center', zIndex: 20 },
    centerButton: { backgroundColor: THEME.success, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 30, borderWidth: 2, borderColor: THEME.cardBg, alignItems: 'center' },
    centerButtonText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
});
