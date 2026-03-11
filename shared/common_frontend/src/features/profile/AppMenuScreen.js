import React from 'react';
import { View, Alert } from 'react-native';
import { GenericMenuScreen } from './GenericMenuScreen';
import { PasskeyManagementSection } from '../auth/components/PasskeyManagementSection';
import { authService } from '../auth/services/authService';

/**
 * @typedef {Object} AppMenuScreenProps
 * @property {string} role - User role: 'admin', 'corporate', 'individual', 'lp'
 * @property {Object} navigation - Navigation object
 * @property {boolean} [showBack=true] - Whether to show the back button
 * @property {React.ReactNode} [bottomNav] - Optional bottom navigation component
 */

/**
 * AppMenuScreen - A universal menu screen driven by user roles.
 * Integrates common logic for security (Passkey) and logout across all apps.
 * 
 * @param {AppMenuScreenProps} props
 */
export const AppMenuScreen = ({
    role,
    navigation,
    showBack = true,
    bottomNav
}) => {

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            Alert.alert('ログアウトに失敗しました', e?.message ? String(e.message) : '');
        }
    };

    /**
     * Common menu item handler
     */
    const handleItemPress = (item, nav) => {
        if (item.id === 'logout') {
            Alert.alert('ログアウト', 'ログアウトしますか？', [
                { text: 'キャンセル', style: 'cancel' },
                { text: 'ログアウト', style: 'destructive', onPress: handleLogout },
            ]);
            return;
        }

        if (item.target) {
            nav.navigate(item.target, { isEdit: true });
            return;
        }

        Alert.alert('準備中', 'この機能は現在準備中です。');
    };

    // Role-based menu configuration
    const getMenuGroups = () => {
        const groups = [];

        // 1. Primary Settings Group
        if (role === 'individual') {
            groups.push({
                title: '個人設定',
                items: [
                    { id: 'profile', label: 'プロフィール編集', icon: 'person-outline', target: 'Registration' },
                    { id: 'account', label: 'アカウント情報 / セキュリティ', icon: 'id-card-outline' },
                    { id: 'payment', label: '決済情報', icon: 'card-outline' },
                ]
            });
        } else if (role === 'corporate') {
            groups.push({
                title: '法人設定',
                items: [
                    { id: 'profile', label: '企業プロフィール編集', icon: 'business-outline', target: 'Registration' },
                    { id: 'account', label: 'アカウント情報 / セキュリティ', icon: 'id-card-outline' },
                ]
            });
        } else if (role === 'admin') {
            groups.push({
                title: '管理者設定',
                items: [
                    { id: 'admin_security', label: 'アカウント情報 / セキュリティ', icon: 'shield-checkmark-outline' },
                ]
            });
        } else if (role === 'lp') {
            groups.push({
                title: 'セキュリティ',
                items: [
                    { id: 'pw_change', label: 'パスワード変更', icon: 'key-outline' },
                ]
            });
        }

        // 2. App Settings Group
        if (role !== 'admin') {
            groups.push({
                title: 'アプリ設定',
                items: [
                    { id: 'display', label: 'デザイン・表示設定', icon: 'color-palette-outline' },
                ]
            });
        }

        // 3. Common Support group
        groups.push({
            title: 'その他',
            items: [
                { id: 'help', label: 'ヘルプ / お問合せ', icon: 'help-circle-outline' },
                { id: 'terms', label: '利用規約', icon: 'document-text-outline' },
                { id: 'logout', label: 'ログアウト', icon: 'log-out-outline', color: '#EF4444' },
            ]
        });

        return groups;
    };

    return (
        <View style={{ flex: 1 }}>
            <GenericMenuScreen
                menuGroups={getMenuGroups()}
                onItemPress={handleItemPress}
                showBack={showBack}
            >
                <PasskeyManagementSection />
            </GenericMenuScreen>
            {bottomNav}
        </View>
    );
};
