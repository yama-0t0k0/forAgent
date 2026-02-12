import React from 'react';
import { GenericBottomNav } from './GenericBottomNav';

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
 * @param {Object} props.navigation - Navigation object
 * @param {string} [props.activeTab='CompanyPage'] - Currently active tab ID
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
        <GenericBottomNav
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handlePress}
        />
    );
};
