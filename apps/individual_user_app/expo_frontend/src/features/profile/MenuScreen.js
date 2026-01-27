import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GenericMenuScreen } from '@shared/src/features/profile/GenericMenuScreen';
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
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyPage')}>
                        <Ionicons name="person-circle-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>キャリア</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="people-circle-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>つながり</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyPage')}>
                        <Ionicons name="home-outline" size={26} color={THEME.subText} />
                        <Text style={styles.navText}>ホーム</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="book-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>学習</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={styles.activeIconContainer}>
                            <Ionicons name="grid" size={26} color={THEME.background} />
                        </View>
                        <Text style={styles.navTextActive}>メニュー</Text>
                    </TouchableOpacity>
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
    activeIconContainer: {
        width: 38,
        height: 38,
        backgroundColor: THEME.accent,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 3,
    },
    navText: {
        color: THEME.subText,
        fontSize: 11,
        marginTop: 2,
    },
    navTextActive: {
        color: THEME.accent,
        fontSize: 11,
        fontWeight: '800',
        marginTop: 2,
    },
});
