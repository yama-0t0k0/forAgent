import React from 'react';
import { GenericBottomNav } from './GenericBottomNav';
import { APP_TABS } from '@shared/src/core/constants/ui';

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
export const BottomNav = ({ navigation, activeTab = APP_TABS.HOME, userDoc = null }) => {
    const tabs = [
        { id: APP_TABS.CAREER, label: 'キャリア', icon: 'person-circle-outline' },
        { id: APP_TABS.CONNECTION, label: 'つながり', icon: 'people-circle-outline' },
        { id: APP_TABS.HOME, label: 'ホーム', icon: 'home-outline', activeIcon: 'home' },
        { id: APP_TABS.SEARCH, label: '探す', icon: 'search-outline', activeIcon: 'search' },
        { id: APP_TABS.MENU, label: 'メニュー', icon: 'grid-outline', activeIcon: 'grid' },
    ];

    /**
     * Handles tab press navigation.
     * @param {string} tabId - The ID of the tab to navigate to.
     */
    const handlePress = (tabId) => {
        if (tabId === APP_TABS.HOME) {
            navigation.navigate(ROUTES.INDIVIDUAL_MY_PAGE, { userDoc });
        } else if (tabId === APP_TABS.CONNECTION) {
            navigation.navigate(ROUTES.INDIVIDUAL_CONNECTION, { userDoc });
        } else if (tabId === APP_TABS.SEARCH) {
            navigation.navigate(ROUTES.INDIVIDUAL_JOB_SEARCH, { userDoc });
        } else if (tabId === APP_TABS.MENU) {
            navigation.navigate(ROUTES.MENU, { userDoc });
        } else if (tabId === APP_TABS.CAREER) {
            navigation.navigate(ROUTES.INDIVIDUAL_CAREER, { userDoc });
        } else if (tabId === APP_TABS.REGISTRATION) {
            navigation.navigate(ROUTES.REGISTRATION, { isEdit: true, userDoc });
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
