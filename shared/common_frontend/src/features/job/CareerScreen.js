import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '@shared/src/core/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * @typedef {Object} CareerScreenProps
 * @property {Object} navigation - Navigation object
 */

/**
 * Career Screen
 * Displays career progress and selection status.
 * 
 * @param {CareerScreenProps} props
 * @param {Object} props.navigation - Navigation object
 * @param {boolean} [props.hideSafeArea] - Whether to hide safe area
 */
export const CareerScreen = ({ navigation, hideSafeArea }) => {
    const ContentWrapper = hideSafeArea ? View : SafeAreaView;

    return (
        <View style={styles.container}>
            <ContentWrapper style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>キャリア (選考進捗)</Text>
                </View>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name='briefcase-outline' size={80} color={THEME.subText} />
                    </View>
                    <Text style={styles.messageTitle}>現在進行中のデータはありません</Text>
                    <Text style={styles.messageSub}>新しい求人への応募や企業とのコンタクトが開始されると、こちらに進捗が表示されます。</Text>
                </View>
            </ContentWrapper>
            {!hideSafeArea && <BottomNav navigation={navigation} activeTab='Career' />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: THEME.text,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 24,
        opacity: 0.5,
    },
    messageTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    messageSub: {
        fontSize: 14,
        color: THEME.subText,
        textAlign: 'center',
        lineHeight: 22,
    },
});
