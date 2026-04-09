import React from 'react';
import { View, Alert } from 'react-native';
import { GenericMenuScreen } from './GenericMenuScreen';
import { PasskeyManagementSection } from '../auth/components/PasskeyManagementSection';
import { authService } from '../auth/services/authService';
import { THEME } from '@shared/src/core/theme/theme';
import { DataContext } from '@shared/src/core/state/DataContext';
import { User } from '@shared/src/core/models/User';

/**
 * @typedef {Object} AppMenuScreenProps
 * @property {string} role - User role: 'admin', 'corporate', 'individual', 'lp'
 * @property {Object} navigation - Navigation object
 * @property {boolean} [showBack=true] - Whether to show the back button
 * @property {React.ReactNode} [bottomNav] - Optional bottom navigation component
 * @property {function(): Promise<void>} [onLogout] - Optional logout handler override
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
    bottomNav,
    onLogout
}) => {
    const { data } = React.useContext(DataContext);

    // Initial hydration of user model
    const user = data instanceof User ? data : User.fromFirestore(data?.uid || '', data);

    const handleLogout = async () => {
        try {
            if (typeof onLogout === 'function') {
                await onLogout();
                return;
            }

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
            nav.navigate(item.target, { isEdit: true, ...(item.params || {}) });
            return;
        }

        Alert.alert('準備中', 'この機能は現在準備中です。');
    };

    // Role-based menu configuration
    const getMenuGroups = () => {
        const groups = [];

        // 1. Primary Settings Group
        if (role === 'individual') {
            const individualItems = [
                { id: 'profile', label: 'プロフィール編集', icon: 'person-outline', target: 'Registration' },
                { id: 'account', label: 'アカウント情報 / セキュリティ', icon: 'id-card-outline' },
            ];

            // Add Corporate Registration option if eligible
            // Note: In a real app, we would get the user model from state here
            // For now, we assume the UI will be updated once the user model is fully hydrated
            individualItems.push({ id: 'payment', label: '決済情報', icon: 'card-outline' });

            groups.push({
                title: '個人設定',
                items: individualItems
            });
            
            // 1.5 Hybrid/Corporate Transition (Added for #52)
            if (user.canCreateCompany && !user.isCorporateMember()) {
                groups.push({
                    title: '法人サービス',
                    items: [
                       { id: 'corporate_reg', label: '法人アカウント作成', icon: 'business-outline', target: 'Registration', params: { type: 'corporate' } }
                    ]
                });
            }
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
                { id: 'logout', label: 'ログアウト', icon: 'log-out-outline', color: THEME.error },
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
