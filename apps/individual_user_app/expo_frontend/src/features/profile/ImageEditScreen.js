import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GenericImageEditScreen } from '@shared/src/features/profile/GenericImageEditScreen';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';

export const ImageEditScreen = () => {
    return (
        <GenericImageEditScreen
            dataSectionKey="基本情報"
            collectionName="individual"
            idFieldKey="id_individual"
            mainImageConfig={{
                key: 'プロフィール画像URL',
                label: 'プロフィール画像 URL',
                placeholder: 'https://example.com/profile.jpg',
                icon: 'person-outline',
                previewLabel: '顔写真プレビュー'
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
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyPage')}>
                        <Ionicons name="person-circle-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>キャリア</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="people-circle-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>つながり</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyPage')}>
                        <View style={styles.activeIconContainer}>
                            <Ionicons name="home" size={26} color={THEME.background} />
                        </View>
                        <Text style={styles.navTextActive}>ホーム</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="book-outline" size={28} color={THEME.subText} />
                        <Text style={styles.navText}>学習</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Menu')}>
                        <Ionicons name="grid-outline" size={28} color={THEME.subText} />
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
