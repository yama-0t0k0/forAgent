import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GenericMenuScreen } from '@shared/src/features/profile/GenericMenuScreen';
import { BottomNavItem } from '@shared/src/core/components/BottomNavItem';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * Screen displaying the menu with various settings and options.
 * @returns {JSX.Element} The rendered menu screen.
 */
export const MenuScreen = () => {
    const menuGroups = [
        {
            title: '企業設定',
            items: [
                { id: 'profile', label: '企業プロフィール編集', icon: 'business-outline', target: 'Registration' },
                { id: 'account', label: 'アカウント情報 / セキュリティ', icon: 'shield-checkmark-outline' },
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
            console.log('Help');
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
                        label="求人" 
                        icon="briefcase-outline" 
                        onPress={() => navigation.navigate('Jobs')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="つながり" 
                        icon="people-circle-outline" 
                        onPress={() => navigation.navigate('Connections')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="使用技術" 
                        icon="code-slash-outline" 
                        onPress={() => navigation.navigate('TechStack')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="ブログ" 
                        icon="newspaper-outline" 
                        onPress={() => navigation.navigate('Blog')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="イベント" 
                        icon="calendar-outline" 
                        onPress={() => navigation.navigate('Events')} 
                        style={styles.navItem} 
                    />
                    <BottomNavItem 
                        label="メニュー" 
                        icon="grid" 
                        isActive={true} 
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
        backgroundColor: '#FFF',
        height: 85,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: THEME.accent,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    navText: {
        color: THEME.subText,
        fontSize: 9,
        marginTop: 4,
        fontWeight: '600',
    },
    navTextActive: {
        color: THEME.accent,
        fontSize: 9,
        fontWeight: '800',
        marginTop: 4,
    },
});
