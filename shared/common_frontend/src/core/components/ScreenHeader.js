import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '@shared/src/core/theme/theme';
import { IconButton } from '@shared/src/core/components/IconButton';
import { Ionicons } from '@expo/vector-icons';

/**
 * ScreenHeader - A standard header for all screens.
 * 
 * @param {Object} props
 * @param {string} props.title - The title to display
 * @param {boolean} [props.showBack=true] - Whether to show the back button
 * @param {React.ReactNode} [props.rightAction] - Optional action to show on the right
 * @param {Function} [props.onBack] - Optional back action override
 */
export const ScreenHeader = ({
    title,
    showBack = true,
    rightAction,
    onBack
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <IconButton
                        onPress={handleBack}
                        // hitSlop is handled inside IconButton.js if it follows standard implementation
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color={THEME.text} />
                    </IconButton>
                )}
            </View>

            <View style={styles.centerContainer}>
                <Text style={[THEME.typography.h2, styles.title]} numberOfLines={1} testID="header_title">
                    {title}
                </Text>
            </View>

            <View style={styles.rightContainer}>
                {rightAction}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.md,
        backgroundColor: THEME.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: THEME.cardBorder,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerContainer: {
        flex: 4,
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    title: {
        color: THEME.text,
    },
    backButton: {
        marginLeft: -THEME.spacing.sm,
    }
});
