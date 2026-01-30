import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * @typedef {Object} TabItem
 * @property {string} id - Unique identifier for the tab
 * @property {string} label - Display label
 * @property {string} icon - Icon name (Ionicons)
 * @property {string} [activeIcon] - Icon name when active (optional)
 */

/**
 * @typedef {Object} GenericBottomNavProps
 * @property {TabItem[]} tabs - List of tabs to display
 * @property {string} activeTab - Currently active tab ID
 * @property {function(string): void} onTabPress - Callback when a tab is pressed
 */

/**
 * Generic Bottom Navigation Component.
 * Reusable component for bottom navigation bars.
 * 
 * @param {GenericBottomNavProps} props
 */
export const GenericBottomNav = ({ tabs, activeTab, onTabPress }) => {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.navItem}
                        onPress={() => onTabPress(tab.id)}
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
        width: 38,
        height: 38,
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
