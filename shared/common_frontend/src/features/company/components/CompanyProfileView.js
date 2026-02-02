import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap } from 'react-native-tab-view';

import { THEME } from '@shared/src/core/theme/theme';
import { PLATFORM } from '@shared/src/core/constants/system';
import { TechStackView } from '@shared/src/features/analytics/components/TechStackView';
import { IconButton } from '@shared/src/core/components/IconButton';
import { BottomNavItem } from '@shared/src/core/components/BottomNavItem';

// Enable LayoutAnimation on Android
if (Platform.OS === PLATFORM.ANDROID) {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');

/**
 * Component for displaying the menu.
 * @param {Object} props
 * @param {Array} props.menuGroups - Menu configuration
 * @param {Function} props.onMenuPress - Callback for menu item press
 */
const MenuView = ({ menuGroups, onMenuPress }) => {
    return (
        <ScrollView contentContainerStyle={styles.menuScrollContent} bounces={false}>
            {menuGroups.map((group, groupIdx) => (
                <View key={groupIdx} style={styles.menuGroup}>
                    <Text style={styles.menuGroupTitle}>{group.title}</Text>
                    <View style={styles.menuGroupCard}>
                        {group.items.map((item, itemIdx) => (
                            <IconButton
                                key={item.id}
                                style={[
                                    styles.menuItem,
                                    itemIdx < group.items.length - 1 && styles.menuItemBorder
                                ]}
                                onPress={() => onMenuPress(item)}
                                hitSlop={null}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Ionicons name={item.icon} size={22} color={item.color || THEME.text} />
                                    <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                                        {item.label}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
                            </IconButton>
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
 * @param {string} props.title - Screen title
 */
const UnderConstructionView = ({ title }) => (
    <View style={styles.centerContent}>
        <Text style={styles.ucTitle}>{title}</Text>
        <Text style={styles.ucSubtitle}>現在工事中です</Text>
    </View>
);

/**
 * Shared component for displaying company profile.
 * Can be used in Corporate App (editable) and Admin/Individual App (read-only).
 * 
 * @param {Object} props
 * @param {Object} props.companyData - Adapted company data object
 * @param {boolean} props.isEditable - Whether to show edit controls
 * @param {Function} props.onEditPress - Callback for edit button press
 * @param {Function} props.onNotificationPress - Callback for notification button press
 * @param {Array} props.menuGroups - Menu configuration for the menu tab
 * @param {Function} props.onMenuPress - Callback for menu item press
 * @param {ImageSourcePropType} props.defaultBackgroundImage - Default background image source
 */
export const CompanyProfileView = ({
    companyData,
    isEditable = false,
    onEditPress,
    onNotificationPress,
    menuGroups = [],
    onMenuPress,
    defaultBackgroundImage,
}) => {
    const {
        companyName,
        businessContent,
        backgroundUrl,
        logoUrl,
        raw: { companyInfo, features, techStack }
    } = companyData;

    // TabView State - Default to TechStack (index 2)
    const [index, setIndex] = useState(2);
    
    // Define routes based on isEditable and provided menuGroups
    // Only show 'menu' tab if menuGroups are provided
    const baseRoutes = [
        { key: 'jobs', title: '求人', icon: 'briefcase-outline' },
        { key: 'connections', title: 'つながり', icon: 'people-circle-outline' },
        { key: 'tech_stack', title: '使用技術', icon: 'code-slash-outline' },
        { key: 'blog', title: 'ブログ', icon: 'newspaper-outline' },
        { key: 'events', title: 'イベント', icon: 'calendar-outline' },
    ];

    const [routes] = useState(
        (menuGroups && menuGroups.length > 0) 
            ? [...baseRoutes, { key: 'menu', title: 'メニュー', icon: 'grid-outline' }]
            : baseRoutes
    );

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
                return <TechStackView features={features} techStack={techStack} />;
            case 'blog':
                return <UnderConstructionView title="ブログ" />;
            case 'events':
                return <UnderConstructionView title="イベント" />;
            case 'menu':
                return <MenuView menuGroups={menuGroups} onMenuPress={onMenuPress} />;
            default:
                return null;
        }
    };

    /**
     * Renders the tab bar.
     * @returns {null} We use a custom footer instead.
     */
    const renderTabBar = () => null;

    return (
        <View style={styles.container}>
            {/* 1. Fixed Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerBackgroundContainer}>
                    <Image
                        source={backgroundUrl ? { uri: backgroundUrl } : defaultBackgroundImage}
                        style={styles.headerBackgroundImage}
                        resizeMode="cover"
                    />
                    <View style={styles.headerOverlay} />
                </View>

                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    <View style={styles.topProfileContainer}>
                        {/* Header Action Buttons (Editable Only) */}
                        {isEditable && (
                            <View style={styles.headerActionContainer}>
                                <IconButton
                                    name="notifications-outline"
                                    size={24}
                                    color="#FFF"
                                    style={styles.headerIconButton}
                                    onPress={onNotificationPress}
                                />
                                <IconButton
                                    name="create-outline"
                                    size={24}
                                    color="#FFF"
                                    style={styles.headerIconButton}
                                    onPress={onEditPress}
                                />
                            </View>
                        )}

                        {/* Company Profile Row */}
                        <View style={styles.profileRow}>
                            <View style={styles.photoContainer}>
                                <Image
                                    source={logoUrl ? { uri: logoUrl } : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(companyName || 'Company') + '&background=random' }}
                                    style={styles.profileImage}
                                />
                            </View>
                            <View style={styles.namePlate}>
                                <Text style={styles.nameText} testID="company_detail_name">{String(companyName || '')}</Text>
                                <Text style={styles.industryText} numberOfLines={2}>{String(businessContent || '')}</Text>

                                {/* External Links */}
                                <View style={styles.linkIconsRow}>
                                    <IconButton
                                        name="globe-outline"
                                        size={16}
                                        color={THEME.accent}
                                        style={styles.linkIcon}
                                    />
                                    <IconButton
                                        name="logo-github"
                                        size={16}
                                        color={THEME.text}
                                        style={styles.linkIcon}
                                    />
                                    <IconButton
                                        name="document-text-outline"
                                        size={16}
                                        color={THEME.subText}
                                        style={styles.linkIcon}
                                    />
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
                swipeEnabled={false}
                animationEnabled={false}
            />

            {/* 3. Custom Bottom Navigation (Footer) */}
            <View style={styles.bottomNav}>
                {routes.map((route, i) => {
                    const isActive = index === i;
                    return (
                        <BottomNavItem
                            key={route.key}
                            label={route.title}
                            icon={route.icon}
                            isActive={isActive}
                            onPress={() => setIndex(i)}
                            style={styles.navItem}
                        />
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
        height: height * 0.28,
        justifyContent: 'flex-end',
    },
    headerBackgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    headerBackgroundImage: {
        width: '100%',
        height: height * 0.4,
        position: 'absolute',
        bottom: 0,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    headerSafeArea: {
        flex: 1,
        justifyContent: 'flex-end',
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
        marginBottom: 10,
    },
    photoContainer: {
        width: 60,
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
        paddingVertical: 6,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    announcementText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
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
});
