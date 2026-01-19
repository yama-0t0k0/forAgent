import React from 'react';
import { GenericMenuScreen } from './GenericMenuScreen';
import { BottomNav } from '../../core/components/BottomNav';
import { View } from 'react-native';

export const IndividualMenuScreen = ({ navigation }) => {
    const menuGroups = [
        {
            title: '個人設定',
            items: [
                { id: 'profile', label: 'プロフィール編集', icon: 'person-outline', target: 'Registration' },
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
            <BottomNav navigation={navigation} activeTab="Menu" />
        </View>
    );
};
