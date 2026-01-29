import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GenericMenuScreen } from '@shared/src/features/profile/GenericMenuScreen';
import { BottomNavItem } from '@shared/src/core/components/BottomNavItem';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Screen displaying the menu with various settings and options for individual users.
 * @returns {JSX.Element} The rendered menu screen.
 */
export const MenuScreen = () => {
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

    /**
     * Handles the press event for a menu item.
     * @param {Object} item - The menu item.
     * @param {Object} navigation - The navigation object.
     */
    const handlePress = (item, navigation) => {
        if (item.target) {
            navigation.navigate(item.target, { isEdit: true });
        } else if (item.id === 'help') {
            navigation.navigate('MyPage');
        } else {
            console.log(`Pressed ${item.label}`);
        }
    };

    return (
        <GenericMenuScreen
            menuGroups={menuGroups}
            onItemPress={handlePress}
            renderBottomNav={(navigation) => (
                <View style={styles.bottomNav}>
                    <BottomNavItem 
                        label="キャリア" 
                        icon="person-circle-outline" 
                        onPress={() => navigation.navigate('MyPage')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="つながり" 
                        icon="people-circle-outline" 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="ホーム" 
                        icon="home-outline" 
                        onPress={() => navigation.navigate('MyPage')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="学習" 
                        icon="book-outline" 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="メニュー" 
                        icon="grid" 
                        isActive={true} 
                        activeContainerColor={THEME.accent}
                        activeColor={THEME.accent}
                        style={styles.navItem} 
                    />
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        height: 85,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
});
