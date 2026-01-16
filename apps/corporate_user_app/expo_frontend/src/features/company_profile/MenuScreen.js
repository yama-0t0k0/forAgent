import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GenericMenuScreen } from '@shared/src/features/profile/GenericMenuScreen';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

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
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Jobs')}>
                        <Ionicons name="briefcase-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>求人</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Connections')}>
                        <Ionicons name="people-circle-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>つながり</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TechStack')}>
                        <Ionicons name="code-slash-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>使用技術</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Blog')}>
                        <Ionicons name="newspaper-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>ブログ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
                        <Ionicons name="calendar-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>イベント</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={styles.activeIconContainer}>
                            <Ionicons name="grid" size={20} color={THEME.background} />
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
