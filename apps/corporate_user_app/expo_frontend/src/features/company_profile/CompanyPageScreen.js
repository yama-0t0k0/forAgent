import React, { useContext, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { DataContext } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { adaptCompanyData } from '@shared/src/core/utils/CompanyAdapter';
import { CompanyProfileView } from '@shared/src/features/company/components/CompanyProfileView';
import { NotificationListModal } from '@shared/src/features/notification/components/NotificationListModal';
import { NotificationService } from '@shared/src/features/notification/services/notificationService';

// Fallback background image
const DEFAULT_BG_IMAGE = require('@assets/generated/rainforest_bg.png');

/**
 * Main screen for the company profile page.
 * Uses the shared CompanyProfileView component.
 * @returns {JSX.Element} The rendered screen.
 */
export const CompanyPageScreen = () => {
    const { data } = useContext(DataContext);
    const navigation = useNavigation();
    
    // Notification State
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Get current UID from data or fallback
    const uid = data?.uid || data?.id;

    // Adapt data using utility
    const companyData = adaptCompanyData(data);

    // Fetch notifications
    const fetchNotifications = async () => {
        if (uid) {
            try {
                const results = await NotificationService.fetchNotifications(uid);
                setNotifications(results);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [uid]);

    // Menu Configuration
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
                { id: 'logout', label: 'ログアウト', icon: 'log-out-outline', color: THEME.error },
            ]
        }
    ];

    /**
     * Handles the press event for a menu item.
     * @param {Object} item - The menu item.
     */
    const handleMenuPress = (item) => {
        if (item.target) {
            navigation.navigate(item.target, { isEdit: true });
        } else {
            console.log(`Pressed ${item.label}`);
        }
    };

    return (
        <>
            <CompanyProfileView
                companyData={companyData}
                uid={uid}
                isEditable={true}
                onEditPress={() => navigation.navigate('ImageEdit')}
                onNotificationPress={() => setIsNotificationVisible(true)}
                menuGroups={menuGroups}
                onMenuPress={handleMenuPress}
                defaultBackgroundImage={DEFAULT_BG_IMAGE}
            />

            <NotificationListModal
                visible={isNotificationVisible}
                onClose={() => setIsNotificationVisible(false)}
                notifications={notifications}
                onRefresh={fetchNotifications}
            />
        </>
    );
};
