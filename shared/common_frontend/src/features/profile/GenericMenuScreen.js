// 役割:
// - アプリ設定やアカウント情報などのメニュー一覧を表示する汎用スクリーン
// - 個人ユーザーと法人ユーザーの両方で使用可能
//
// 主要機能:
// - グループ化されたメニュー項目のリスト表示
// - 各項目のアイコン、ラベル、遷移先のカスタマイズ
// - ボトムナビゲーションのカスタマイズ（render props）
//
// ディレクトリ構造:
// shared/common_frontend/src/features/profile/GenericMenuScreen.js
//

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const GenericMenuScreen = ({
  menuGroups,
  renderBottomNav,
  onItemPress
}) => {
    const navigation = useNavigation();

    const handlePress = (item) => {
        if (onItemPress) {
            onItemPress(item, navigation);
            return;
        }

        if (item.target) {
            navigation.navigate(item.target, { isEdit: true });
        } else {
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
                                    <Ionicons name={item.rightIcon || "chevron-forward"} size={18} color={THEME.subText} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {renderBottomNav && renderBottomNav(navigation)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
});
