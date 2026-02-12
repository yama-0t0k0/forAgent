import React from 'react';
import { GenericMenuScreen } from './GenericMenuScreen';
import { CorporateBottomNav } from '@shared/src/core/components/CorporateBottomNav';
import { View } from 'react-native';

/**
 * @typedef {Object} CorporateMenuScreenProps
 * @property {Object} navigation - Navigation object
 * @property {boolean} [hideSafeArea=false] - Whether to hide the bottom navigation
 */

/**
 * Corporate Menu Screen
 * Wrapper around GenericMenuScreen for Corporate Users.
 * Defines the menu structure for corporate users.
 * 
 * @param {CorporateMenuScreenProps} props
 * @param {Object} props.navigation - Navigation object
 * @param {boolean} [props.hideSafeArea=false] - Whether to hide the bottom navigation
 */
export const CorporateMenuScreen = ({ navigation, hideSafeArea = false }) => {
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
     * Handles menu item press.
     * @param {Object} item - The pressed menu item.
     * @param {Object} nav - Navigation object.
     */
    const handlePress = (item, nav) => {
        if (item.target) {
            nav.navigate(item.target, { isEdit: true });
        } else {
            console.log(`Pressed ${item.label}`);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <GenericMenuScreen
                menuGroups={menuGroups}
                onItemPress={handlePress}
            />
            {!hideSafeArea && <CorporateBottomNav navigation={navigation} activeTab='Menu' />}
        </View>
    );
};
