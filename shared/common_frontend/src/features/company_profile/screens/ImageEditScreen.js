import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GenericImageEditScreen } from '@shared/src/features/profile/GenericImageEditScreen';
import { DataContext } from '../../../core/state/DataContext';
import { THEME } from '../../../core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

export const ImageEditScreen = () => {
    return (
        <GenericImageEditScreen
            dataSectionKey="会社概要"
            collectionName="company"
            idFieldKey="id"
            mainImageConfig={{
                key: 'ロゴ画像URL',
                label: 'ロゴ画像 URL',
                placeholder: 'https://example.com/logo.jpg',
                icon: 'business-outline',
                previewLabel: 'ロゴプレビュー'
            }}
            bgImageConfig={{
                key: '背景画像URL',
                label: '背景画像 URL',
                placeholder: 'https://example.com/background.jpg',
                icon: 'image-outline',
                previewLabel: '背景プレビュー'
            }}
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
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Menu')}>
                        <Ionicons name="grid-outline" size={24} color={THEME.subText} />
                        <Text style={styles.navText}>メニュー</Text>
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
    navText: {
        color: THEME.subText,
        fontSize: 9,
        marginTop: 4,
        fontWeight: '600',
    },
});
