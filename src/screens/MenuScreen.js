import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { THEME } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const MenuScreen = () => {
    const navigation = useNavigation();

    const menuGroups = [
        {
            title: '個人設定',
            items: [
                { id: 'profile', label: 'プロフィール編集', icon: 'person-outline', target: 'Registration' },
                { id: 'account', label: 'アカウント情報', icon: 'id-card-outline' },
                { id: 'payment', label: '決済情報', icon: 'card-outline' },
                { id: 'connections', label: 'つながり管理', icon: 'people-outline' },
            ]
        },
        {
            title: 'アプリ設定',
            items: [
                { id: 'notifications', label: '通知設定', icon: 'notifications-outline' },
                { id: 'security', label: 'セキュリティ・プライバシー', icon: 'lock-closed-outline' },
                { id: 'display', label: 'デザイン・表示設定', icon: 'color-palette-outline' },
            ]
        },
        {
            title: 'その他',
            items: [
                { id: 'help', label: 'ヘルプ・サポート', icon: 'help-circle-outline' },
                { id: 'terms', label: '利用規約', icon: 'document-text-outline' },
                { id: 'logout', label: 'ログアウト', icon: 'log-out-outline', color: '#EF4444' },
            ]
        }
    ];

    const handlePress = (item) => {
        if (item.target) {
            navigation.navigate(item.target, { isEdit: true });
        } else {
            // Placeholder for other actions
            console.log(`Pressed ${item.label}`);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>メニュー</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {menuGroups.map((group, groupIdx) => (
                    <View key={groupIdx} style={styles.group}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupCard}>
                            {group.items.map((item, itemIdx) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.menuItem,
                                        itemIdx < group.items.length - 1 && styles.menuItemBorder
                                    ]}
                                    onPress={() => handlePress(item)}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <Ionicons name={item.icon} size={22} color={item.color || THEME.text} />
                                        <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                                            {item.label}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={THEME.subText} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Support Footer */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyPage')}>
                    <Ionicons name="person-circle-outline" size={28} color={THEME.subText} />
                    <Text style={styles.navText}>キャリア</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="people-circle-outline" size={28} color={THEME.subText} />
                    <Text style={styles.navText}>コネクション</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Slightly different background for menu contrast
    },
    header: {
        backgroundColor: THEME.background,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
    },
    headerContent: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: THEME.text,
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 120,
    },
    group: {
        marginBottom: 25,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.subText,
        marginBottom: 8,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    groupCard: {
        backgroundColor: THEME.cardBg,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: THEME.cardBorder,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
        borderStyle: 'dashed',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.text,
        marginLeft: 12,
    },
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
