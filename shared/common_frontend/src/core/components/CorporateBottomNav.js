import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} CorporateBottomNavProps
 * @property {Object} navigation - Navigation object
 * @property {string} [activeTab='CompanyPage'] - Currently active tab ID
 */

/**
 * Bottom Navigation Bar Component for Corporate Users.
 * Provides navigation between corporate screens (Jobs, TechStack, Connections, etc.).
 * 
 * @param {CorporateBottomNavProps} props
 */
export const CorporateBottomNav = ({ navigation, activeTab = 'CompanyPage' }) => {
    const tabs = [
        { id: 'Jobs', label: '求人', icon: 'briefcase-outline' },
        { id: 'Connections', label: 'つながり', icon: 'people-circle-outline' },
        { id: 'CompanyPage', label: 'ホーム', icon: 'home-outline', activeIcon: 'home' },
        { id: 'TechStack', label: '技術', icon: 'code-slash-outline' },
        { id: 'Menu', label: 'メニュー', icon: 'grid-outline' },
    ];

    /**
     * Handles tab press navigation.
     * @param {string} tabId - The ID of the tab to navigate to.
     */
    const handlePress = (tabId) => {
        navigation.navigate(tabId);
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.navItem}
                        onPress={() => handlePress(tab.id)}
                        testID={`nav_tab_${tab.id}`}
                    >
                        {isActive ? (
                            <View style={styles.activeIconContainer}>
                                <Ionicons name={tab.activeIcon || tab.icon.replace('-outline', '')} size={24} color={THEME.background} />
                            </View>
                        ) : (
                            <Ionicons name={tab.icon} size={26} color={THEME.subText} />
                        )}
                        <Text style={isActive ? styles.navTextActive : styles.navText}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
        zIndex: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeIconContainer: {
        width: 36,
        height: 36,
        backgroundColor: THEME.accent,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    navText: {
        color: THEME.subText,
        fontSize: 10,
        marginTop: 2,
    },
    navTextActive: {
        color: THEME.accent,
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
    },
});
