import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ImageBackground, LayoutAnimation, Platform, UIManager } from 'react-native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap } from 'react-native-tab-view';

import { adaptCompanyData } from '@shared/src/core/utils/CompanyAdapter';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');

// Fallback background image (assuming it exists in the app that consumes this component or pass as prop)
// Using a placeholder or passing it from parent is better, but for now we try to resolve it if possible or use a color
// Modified to not require local asset directly to avoid path issues across apps
const DEFAULT_BG_IMAGE = require('../../../assets/generated/rainforest_bg.png');

/**
 * Component to display the technology stack and features of a company.
 * @param {Object} props
 * @param {Object} props.features - The features of the company.
 * @param {Object} props.techStack - The technology stack of the company.
 * @returns {JSX.Element} The rendered view.
 */
const TechStackView = ({ features, techStack }) => {
    /**
     * Renders a single technology item.
     * @param {string} label - The label of the item.
     * @param {string} main - The main technology.
     * @param {string} sub - The sub technology.
     * @param {string} iconName - The icon name.
     * @returns {JSX.Element} The rendered item.
     */
    const renderTechItem = (label, main, sub, iconName) => (
        <View style={styles.techItemContainer}>
            <View style={styles.techHeader}>
                <Ionicons name={iconName} size={14} color={THEME.subText} style={{ marginRight: 4 }} />
                <Text style={styles.techLabel}>{label}</Text>
            </View>
            <View style={styles.techBadgeContainer}>
                <View style={[styles.techBadge, styles.techBadgeMain]}>
                    <Text style={styles.techBadgeTextMain}>{String(main || '-')}</Text>
                </View>
                {sub && (
                    <View style={[styles.techBadge, styles.techBadgeSub]}>
                        <Text style={styles.techBadgeTextSub}>{String(sub)}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false); // Default collapsed

    /**
     * Toggles the visibility of the features section.
     */
    const toggleFeatures = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsFeaturesExpanded(!isFeaturesExpanded);
    };

    // Safe access helpers
    /**
     * Helper to safely access language data.
     * @param {string} type - The type of language.
     * @returns {Object} The language data.
     */
    const getLang = (type) => techStack?.languages?.[type] || {};
    /**
     * Helper to safely access other tech data.
     * @param {string} type - The type of tech.
     * @returns {Object} The tech data.
     */
    const getOther = (type) => techStack?.others?.[type] || {};

    return (
        <ScrollView contentContainerStyle={styles.tabScrollContent} bounces={false}>
            {/* 1. Tech Stack Section */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>使用技術</Text>
                <View style={styles.techGrid}>
                    <View style={styles.techColumn}>
                        <Text style={styles.subSectionTitle}>言語</Text>
                        {renderTechItem('Backend', getLang('backend').main, getLang('backend').sub, 'server-outline')}
                        {renderTechItem('Frontend', getLang('frontend').main, getLang('frontend').sub, 'desktop-outline')}
                    </View>
                    <View style={styles.techColumn}>
                        <Text style={styles.subSectionTitle}>その他</Text>
                        {renderTechItem('Framework', getOther('framework').main, getOther('framework').sub, 'layers-outline')}
                        {renderTechItem('Cloud', getOther('cloud').main, getOther('cloud').sub, 'cloud-outline')}
                        {renderTechItem('DB', getOther('database').main, getOther('database').sub, 'server-outline')}
                        {renderTechItem('Tools', getOther('tools').main, getOther('tools').sub, 'construct-outline')}
                    </View>
                </View>
            </View>

            {/* 2. Features/Accordion Section (Moved here from Menu) */}
            <View style={[styles.sectionContainer, { marginBottom: 80 }]}>
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
                                <Text style={styles.featureNoteText}>{String(features['エンジニアにとってのその他の魅力'])}</Text>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

/**
 * Component for displaying the menu.
 * @returns {JSX.Element} The rendered menu view.
 */
const MenuView = () => {
    const navigation = useNavigation();

    const menuGroups = [
        {
            title: '法人設定',
            items: [
                { id: 'profile', label: '企業情報編集', icon: 'business-outline', target: 'Registration' },
                { id: 'account', label: 'アカウント情報 / セキュリティ', icon: 'id-card-outline' },
                { id: 'payment', label: '決済情報', icon: 'card-outline' },
            ]
        },
        {
            title: 'アプリ設定',
            items: [
                { id: 'display', label: 'デザイン・表示設定', icon: 'color-palette-outline' },
            ]
        },
        {
            title: 'その他',
            items: [
                { id: 'help', label: 'ヘルプ / お問合せ', icon: 'help-circle-outline' },
                { id: 'terms', label: '利用規約', icon: 'document-text-outline' },
                { id: 'logout', label: 'ログアウト', icon: 'log-out-outline', color: '#EF4444' },
            ]
        }
    ];

    /**
     * Handles the press event for a menu item.
     * @param {Object} item - The menu item.
     */
    const handlePress = (item) => {
        if (item.target) {
            navigation.navigate(item.target, { isEdit: true });
        } else {
            console.log(`Pressed ${item.label}`);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.menuScrollContent} bounces={false}>
            {menuGroups.map((group, groupIdx) => (
                <View key={groupIdx} style={styles.menuGroup}>
                    <Text style={styles.menuGroupTitle}>{group.title}</Text>
                    <View style={styles.menuGroupCard}>
                        {group.items.map((item, itemIdx) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    itemIdx < group.items.length - 1 && styles.menuItemBorder
                                ]}
                                onPress={() => handlePress(item)}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Ionicons name={item.icon} size={22} color={item.color || THEME.text} />
                                    <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                                        {item.label}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

/**
 * Placeholder component for screens under construction.
 * @param {Object} props
 * @param {string} props.title - The title of the screen.
 * @returns {JSX.Element} The rendered placeholder view.
 */
const UnderConstructionView = ({ title }) => (
    <View style={styles.centerContent}>
        <Text style={styles.ucTitle}>{title}</Text>
        <Text style={styles.ucSubtitle}>現在工事中です</Text>
    </View>
);

/**
 * Main screen for the company profile page.
 * Manages tab navigation and displays company details.
 * @returns {JSX.Element} The rendered screen.
 */
export const CompanyPageScreen = () => {
    const { data } = useContext(DataContext);
    const navigation = useNavigation();

    // Adapt data using utility
    const {
        companyName,
        businessContent,
        backgroundUrl,
        logoUrl,
        raw: { companyInfo, features, techStack }
    } = adaptCompanyData(data);

    // TabView State - Default to TechStack (index 2)
    const [index, setIndex] = useState(2);
    const [routes] = useState([
        { key: 'jobs', title: '求人', icon: 'briefcase-outline' },
        { key: 'connections', title: 'つながり', icon: 'people-circle-outline' },
        { key: 'tech_stack', title: '使用技術', icon: 'code-slash-outline' },
        { key: 'blog', title: 'ブログ', icon: 'newspaper-outline' },
        { key: 'events', title: 'イベント', icon: 'calendar-outline' },
        { key: 'menu', title: 'メニュー', icon: 'grid-outline' },
    ]);

    /**
     * Renders the scene for the current tab.
     * @param {Object} props
     * @param {Object} props.route - The route object.
     * @returns {JSX.Element|null} The rendered scene.
     */
    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'jobs':
                return <UnderConstructionView title="求人" />;
            case 'connections':
                return <UnderConstructionView title="つながり" />;
            case 'tech_stack':
                // Pass features to TechStackView
                return <TechStackView features={features} techStack={techStack} />;
            case 'blog':
                return <UnderConstructionView title="ブログ" />;
            case 'events':
                return <UnderConstructionView title="イベント" />;
            case 'menu':
                return <MenuView companyInfo={companyInfo} />;
            default:
                return null;
        }
    };

    /**
     * Renders the tab bar.
     * @returns {null} We use a custom footer instead.
     */
    const renderTabBar = () => null; // We use our custom footer instead

    return (
        <View style={styles.container}>
            {/* 1. Fixed Header (Height Reduced) */}
            <View style={styles.headerContainer}>
                {/* 
                  Fix: Crop top of the image to show the bottom part.
                  We use a container with overflow hidden and absolute positioning for the image.
                */}
                <View style={styles.headerBackgroundContainer}>
                    <Image
                        source={backgroundUrl ? { uri: backgroundUrl } : DEFAULT_BG_IMAGE}
                        style={styles.headerBackgroundImage}
                        resizeMode="cover"
                    />
                    <View style={styles.headerOverlay} />
                </View>

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
                                <Text style={styles.nameText} testID="company_detail_name">{String(companyName)}</Text>
                                <Text style={styles.industryText} numberOfLines={2}>{String(businessContent)}</Text>

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

                {/* Announcement Bar */}
                <View style={styles.announcementBar}>
                    <Ionicons name="information-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.announcementText} numberOfLines={1}>
                        会社HPを参考に自動生成した簡易版です。
                    </Text>
                </View>
            </View>

            {/* 2. Tab Content */}
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width }}
                renderTabBar={renderTabBar}
                swipeEnabled={false} // Disable swipe to avoid conflict with horizontal scrolls if any, and force tab usage
                animationEnabled={false} // Immediate switch as requested "no reaction" issue might be due to animation
            />

            {/* 3. Custom Bottom Navigation (Footer) */}
            <View style={styles.bottomNav}>
                {routes.map((route, i) => {
                    const isActive = index === i;
                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.navItem}
                            onPress={() => setIndex(i)}
                        >
                            {isActive ? (
                                <View style={styles.activeIconContainer}>
                                    <Ionicons name={route.icon} size={20} color={THEME.background} />
                                </View>
                            ) : (
                                <Ionicons name={route.icon} size={24} color={THEME.subText} />
                            )}
                            <Text style={isActive ? styles.navTextActive : styles.navText}>
                                {route.title}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    // Header Styles
    headerContainer: {
        width: '100%',
        backgroundColor: THEME.background,
        zIndex: 10,
        height: height * 0.28, // Adjusted to match corporate_user_app design
        justifyContent: 'flex-end', // Align content to bottom
    },
    headerBackgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    headerBackgroundImage: {
        width: '100%',
        height: height * 0.4, // Make image taller than container
        position: 'absolute',
        bottom: 0, // Anchor to bottom so top is cropped
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)', // Slight overlay for readability if needed
    },
    headerSafeArea: {
        flex: 1,
        justifyContent: 'flex-end', // Push content down
        paddingBottom: 10,
    },
    topProfileContainer: {
        paddingHorizontal: 15,
        width: '100%',
        zIndex: 20,
    },
    headerActionContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
        gap: 10,
        marginBottom: 10,
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
        marginBottom: 10, // Adjust spacing
    },
    photoContainer: {
        width: 60, // Slightly smaller
        height: 60,
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
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    nameText: {
        fontSize: 15,
        fontWeight: '800',
        color: THEME.text,
        marginBottom: 2,
    },
    industryText: {
        fontSize: 10,
        color: THEME.subText,
        marginBottom: 4,
        lineHeight: 14,
    },
    linkIconsRow: {
        flexDirection: 'row',
        gap: 12,
        columns: 3,
    },
    linkIcon: {
        padding: 2,
    },
    announcementBar: {
        backgroundColor: THEME.accent,
        paddingVertical: 6, // Reduced padding
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    announcementText: {
        color: '#FFF',
        fontSize: 11, // Smaller font
        fontWeight: '600',
        flex: 1,
    },

    // Tab Content Styles
    tabScrollContent: {
        paddingTop: 15,
        paddingBottom: 0,
    },
    sectionContainer: {
        marginBottom: 15,
        paddingHorizontal: 15,
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

    // Tech Stack Styles
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

    // Accordion / Features Styles
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        paddingBottom: 10,
        marginBottom: 10,
    },
    accordionContent: {
        marginTop: 5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        marginLeft: 10,
        fontSize: 14,
        color: THEME.text,
    },
    featureNote: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: THEME.accent,
    },
    featureNoteText: {
        fontSize: 13,
        color: THEME.subText,
        lineHeight: 18,
    },

    // Menu View Styles
    menuScrollContent: {
        padding: 15,
        paddingBottom: 120,
    },
    menuGroup: {
        marginBottom: 25,
    },
    menuGroupTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.subText,
        marginBottom: 8,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    menuGroupCard: {
        backgroundColor: THEME.cardBg,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        borderStyle: 'dashed',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.text,
        marginLeft: 12,
    },

    // Under Construction Styles
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    ucTitle: {
        color: THEME.text,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    ucSubtitle: {
        color: THEME.subText,
        fontSize: 14,
        fontWeight: '600',
    },

    // Bottom Nav Styles
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        height: 85,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontSize: 9,
        marginTop: 4,
        fontWeight: '600',
    },
    navTextActive: {
        color: THEME.accent,
        fontSize: 9,
        marginTop: 4,
        fontWeight: '800',
    },
    activeIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
