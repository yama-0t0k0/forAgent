import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground, LayoutAnimation, Platform, UIManager } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');

// Fallback background image
const DEFAULT_BG = require('../../../assets/generated/rainforest_bg.png');

// Mock Data for Tech Stack (Since it's not in the JSON template yet)
const MOCK_TECH_STACK = {
    languages: {
        backend: { main: 'Go', sub: 'Python' },
        frontend: { main: 'TypeScript', sub: 'Dart' }
    },
    others: {
        framework: { main: 'React Native', sub: 'Flutter' },
        cloud: { main: 'AWS', sub: 'GCP' },
        database: { main: 'Firestore', sub: 'PostgreSQL' },
        tools: { main: 'GitHub', sub: 'Slack' }
    }
};

export const CompanyPageScreen = () => {
    const { data } = useContext(DataContext);
    const navigation = useNavigation();
    const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);

    // Extract data
    const companyInfo = data['会社概要'] || {};
    const features = data['魅力/特徴'] || {};
    const companyName = companyInfo['社名'] || '会社名未設定';
    const businessContent = companyInfo['事業内容'] || '事業内容が設定されていません。';
    const backgroundUrl = companyInfo['背景画像URL']; // Assuming this field exists or will be added
    const logoUrl = companyInfo['ロゴ画像URL']; // Assuming this field exists

    const toggleFeatures = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFeaturesExpanded(!isFeaturesExpanded);
    };

    const renderTechItem = (label, main, sub, iconName) => (
        <View style={styles.techItemContainer}>
            <View style={styles.techHeader}>
                <Ionicons name={iconName} size={14} color={THEME.subText} style={{ marginRight: 4 }} />
                <Text style={styles.techLabel}>{label}</Text>
            </View>
            <View style={styles.techBadgeContainer}>
                <View style={[styles.techBadge, styles.techBadgeMain]}>
                    <Text style={styles.techBadgeTextMain}>{main}</Text>
                </View>
                {sub && (
                    <View style={[styles.techBadge, styles.techBadgeSub]}>
                        <Text style={styles.techBadgeTextSub}>{sub}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* 1. Header Background */}
                <ImageBackground
                    source={backgroundUrl ? { uri: backgroundUrl } : DEFAULT_BG}
                    style={styles.headerBackground}
                    imageStyle={{ opacity: 0.95 }}
                >
                    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                        <View style={styles.topProfileContainer}>
                            {/* Header Action Buttons */}
                            <View style={styles.headerActionContainer}>
                                <TouchableOpacity style={styles.headerIconButton} onPress={() => console.log('Notifications')}>
                                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('ImageEdit')}>
                                    <Ionicons name="create-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Company Profile Row */}
                            <View style={styles.profileRow}>
                                <View style={styles.photoContainer}>
                                    <Image
                                        source={logoUrl ? { uri: logoUrl } : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(companyName) + '&background=random' }}
                                        style={styles.profileImage}
                                    />
                                </View>
                                <View style={styles.namePlate}>
                                    <Text style={styles.nameText}>{companyName}</Text>
                                    <Text style={styles.industryText} numberOfLines={2}>{businessContent}</Text>
                                    
                                    {/* External Links */}
                                    <View style={styles.linkIconsRow}>
                                        <TouchableOpacity style={styles.linkIcon}>
                                            <Ionicons name="globe-outline" size={16} color={THEME.accent} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.linkIcon}>
                                            <Ionicons name="logo-github" size={16} color={THEME.text} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.linkIcon}>
                                            <Ionicons name="document-text-outline" size={16} color={THEME.subText} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </ImageBackground>

                {/* 3. Announcement Bar */}
                <View style={styles.announcementBar}>
                    <Ionicons name="information-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.announcementText}>
                        会社HPを参考に自動生成した簡易版です。編集画面から加筆修正して完成版としてください。
                    </Text>
                </View>

                {/* 4 & 5. Tech Stack Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>使用技術</Text>
                    <View style={styles.techGrid}>
                        {/* Languages */}
                        <View style={styles.techColumn}>
                            <Text style={styles.subSectionTitle}>言語</Text>
                            {renderTechItem('Backend', MOCK_TECH_STACK.languages.backend.main, MOCK_TECH_STACK.languages.backend.sub, 'server-outline')}
                            {renderTechItem('Frontend', MOCK_TECH_STACK.languages.frontend.main, MOCK_TECH_STACK.languages.frontend.sub, 'desktop-outline')}
                        </View>
                        {/* Others */}
                        <View style={styles.techColumn}>
                            <Text style={styles.subSectionTitle}>その他</Text>
                            {renderTechItem('Framework', MOCK_TECH_STACK.others.framework.main, MOCK_TECH_STACK.others.framework.sub, 'layers-outline')}
                            {renderTechItem('Cloud', MOCK_TECH_STACK.others.cloud.main, MOCK_TECH_STACK.others.cloud.sub, 'cloud-outline')}
                            {renderTechItem('DB', MOCK_TECH_STACK.others.database.main, MOCK_TECH_STACK.others.database.sub, 'server-outline')}
                            {renderTechItem('Tools', MOCK_TECH_STACK.others.tools.main, MOCK_TECH_STACK.others.tools.sub, 'construct-outline')}
                        </View>
                    </View>
                </View>

                {/* 7. Features Accordion */}
                <View style={styles.sectionContainer}>
                    <TouchableOpacity style={styles.accordionHeader} onPress={toggleFeatures}>
                        <Text style={styles.sectionTitle}>魅力/特徴</Text>
                        <Ionicons name={isFeaturesExpanded ? "chevron-up" : "chevron-down"} size={24} color={THEME.text} />
                    </TouchableOpacity>
                    
                    {isFeaturesExpanded && (
                        <View style={styles.accordionContent}>
                            {Object.entries(features).map(([key, value]) => {
                                if (typeof value === 'boolean') {
                                    return (
                                        <View key={key} style={styles.featureItem}>
                                            <Ionicons 
                                                name={value ? "checkmark-circle" : "close-circle"} 
                                                size={18} 
                                                color={value ? THEME.success : THEME.subText} 
                                            />
                                            <Text style={[styles.featureText, !value && { color: THEME.subText }]}>{key}</Text>
                                        </View>
                                    );
                                }
                                return null;
                            })}
                            {features['エンジニアにとってのその他の魅力'] ? (
                                <View style={styles.featureNote}>
                                    <Text style={styles.featureNoteText}>{features['エンジニアにとってのその他の魅力']}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                </View>

                {/* Whitespace buffer */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* 8. Bottom Navigation (Tabs) */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="briefcase-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>求人</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="people-circle-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>つながり</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="code-slash-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>使用技術</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="newspaper-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>ブログ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="calendar-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>イベント</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Menu')}>
                    <Ionicons name="grid-outline" size={24} color={THEME.subText} />
                    <Text style={styles.navText}>メニュー</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    scrollContent: {
        paddingBottom: 0,
    },
    headerBackground: {
        width: '100%',
        height: height * 0.3,
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
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginTop: 20,
    },
    photoContainer: {
        width: 80,
        height: 80,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFF',
        marginRight: 10,
        backgroundColor: '#FFF',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    namePlate: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 4,
    },
    industryText: {
        fontSize: 10,
        color: THEME.subText,
        marginBottom: 6,
        lineHeight: 14,
    },
    linkIconsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    linkIcon: {
        padding: 2,
    },
    announcementBar: {
        backgroundColor: '#F59E0B', // Amber-500
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 8,
    },
    announcementText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        flex: 1,
    },
    sectionContainer: {
        marginHorizontal: 15,
        marginTop: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 10,
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: THEME.subText,
        marginBottom: 8,
        marginTop: 4,
    },
    techGrid: {
        flexDirection: 'row',
        gap: 15,
    },
    techColumn: {
        flex: 1,
    },
    techItemContainer: {
        marginBottom: 10,
    },
    techHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    techLabel: {
        fontSize: 11,
        color: THEME.subText,
        fontWeight: '600',
    },
    techBadgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    techBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
    },
    techBadgeMain: {
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
    },
    techBadgeSub: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    techBadgeTextMain: {
        fontSize: 11,
        color: '#0369A1',
        fontWeight: '700',
    },
    techBadgeTextSub: {
        fontSize: 10,
        color: '#64748B',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accordionContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    featureText: {
        fontSize: 12,
        color: THEME.text,
        flex: 1,
    },
    featureNote: {
        backgroundColor: '#F3F4F6',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
    },
    featureNoteText: {
        fontSize: 11,
        color: THEME.text,
        fontStyle: 'italic',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        height: 85, // Slightly taller for more items
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-between', // Distribute evenly
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    navText: {
        color: THEME.subText,
        fontSize: 9, // Smaller font for 6 items
        marginTop: 4,
        fontWeight: '600',
    },
});
