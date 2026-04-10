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
 * @param {TabItem[]} props.tabs - List of tabs to display
 * @param {string} props.activeTab - Currently active tab ID
 * @param {function(string): void} props.onTabPress - Callback when a tab is pressed
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
                                <Ionicons name={tab.activeIcon || tab.icon.replace('-outline', '')} size={24} color={THEME.textInverse} />
                            </View>
                        ) : (
                            <Ionicons name={tab.icon} size={26} color={THEME.textSecondary} />
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
        backgroundColor: THEME.surface,
        height: 75,
        borderTopWidth: 1,
        borderTopColor: THEME.borderDefault,
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 15,
        zIndex: 10,
        width: '100%',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeIconContainer: {
        width: 38,
        height: 38,
        backgroundColor: THEME.primary,
        borderRadius: THEME.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    navText: {
        color: THEME.textSecondary,
        fontSize: 10,
        marginTop: 2,
    },
    navTextActive: {
        color: THEME.primary,
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
    },
});
