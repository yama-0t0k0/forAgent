import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@shared/src/core/theme/theme';

export const BottomNav = ({ navigation, activeTab = 'Home' }) => {
    const tabs = [
        { id: 'Career', label: 'キャリア', icon: 'person-circle-outline' },
        { id: 'Connection', label: 'つながり', icon: 'people-circle-outline' },
        { id: 'Home', label: 'ホーム', icon: 'home', activeIcon: 'home' },
        { id: 'Learning', label: '学習', icon: 'book-outline' },
        { id: 'Menu', label: 'メニュー', icon: 'grid-outline', activeIcon: 'grid' },
    ];

    const handlePress = (tabId) => {
        if (tabId === 'Home') {
            navigation.navigate('MyPage');
        } else if (tabId === 'Connection') {
            navigation.navigate('Connection');
        } else if (tabId === 'Menu') {
            navigation.navigate('Menu');
        } else if (tabId === 'Career') {
            navigation.navigate('Career');
        } else if (tabId === 'Registration') {
            navigation.navigate('Registration', { isEdit: true });
        } else {
            console.log(`Navigating to ${tabId}`);
        }
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.navItem}
                        onPress={() => handlePress(tab.id)}
                    >
                        {isActive ? (
                            <View style={styles.activeIconContainer}>
                                <Ionicons name={tab.activeIcon || tab.icon.replace('-outline', '')} size={26} color={THEME.background} />
                            </View>
                        ) : (
                            <Ionicons name={tab.icon} size={28} color={THEME.subText} />
                        )}
                        <Text style={isActive ? styles.navTextActive : styles.navText}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: THEME.cardBg,
        height: 75,
        borderTopWidth: 1,
        borderTopColor: THEME.cardBorder,
        alignItems: 'center',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 15,
        zIndex: 10,
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
        fontSize: 10,
        marginTop: 2,
    },
    navTextActive: {
        color: THEME.accent,
        fontSize: 10,
        fontWeight: '800',
        marginTop: 2,
    },
});
