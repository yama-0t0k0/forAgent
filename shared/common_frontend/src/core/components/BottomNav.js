import React from 'react';
import { GenericBottomNav } from './GenericBottomNav';

/**
 * @typedef {Object} BottomNavProps
 * @property {Object} navigation - Navigation object
 * @property {string} [activeTab='Home'] - Currently active tab ID
 * @property {Object} [userDoc=null] - User document (optional)
 */

/**
 * Bottom Navigation Bar Component.
 * Provides navigation between main screens (Home, Career, Connection, etc.).
 * 
 * @param {BottomNavProps} props
 * @param {Object} props.navigation - Navigation object
 * @param {string} [props.activeTab='Home'] - Currently active tab ID
 * @param {Object} [props.userDoc=null] - User document (optional)
 */
export const BottomNav = ({ navigation, activeTab = 'Home', userDoc = null }) => {
    const tabs = [
        { id: 'Career', label: 'キャリア', icon: 'person-circle-outline' },
        { id: 'Connection', label: 'つながり', icon: 'people-circle-outline' },
        { id: 'Home', label: 'ホーム', icon: 'home', activeIcon: 'home' },
        { id: 'Learning', label: '学習', icon: 'book-outline' },
        { id: 'Menu', label: 'メニュー', icon: 'grid-outline', activeIcon: 'grid' },
    ];

    /**
     * Handles tab press navigation.
     * @param {string} tabId - The ID of the tab to navigate to.
     */
    const handlePress = (tabId) => {
        if (tabId === 'Home') {
            navigation.navigate('MyPage', { userDoc });
        } else if (tabId === 'Connection') {
            navigation.navigate('Connection', { userDoc });
        } else if (tabId === 'Menu') {
            navigation.navigate('Menu', { userDoc });
        } else if (tabId === 'Career') {
            navigation.navigate('Career', { userDoc });
        } else if (tabId === 'Registration') {
            navigation.navigate('Registration', { isEdit: true, userDoc });
        } else {
            console.log(`Navigating to ${tabId}`);
        }
    };

    return (
        <GenericBottomNav
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handlePress}
        />
    );
};
