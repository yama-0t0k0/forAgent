import React from 'react';
import { View, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * AppShell - A common base component for all applications in the monorepo.
 * 
 * Provides:
 * - SafeAreaProvider for safe area handling
 * - Standardized StatusBar configuration
 * - Optional Global Loading State
 * - Consistent background styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The main content of the application (usually Navigation)
 * @param {boolean} [props.isLoading=false] - If true, shows the global loading indicator
 * @param {string} [props.loadingText] - Optional text to show under the loading indicator
 * @param {string} [props.backgroundColor] - Override the default theme background
 * @param {string} [props.statusBarStyle='dark-content'] - StatusBar style
 */
export const AppShell = ({
    children,
    isLoading = false,
    loadingText,
    backgroundColor = THEME.background,
    statusBarStyle = 'dark-content'
}) => {
    return (
        <SafeAreaProvider>
            <View style={[styles.container, { backgroundColor }]}>
                <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
                {isLoading ? (
                    <View style={styles.loadingOverlay} testID='loading_indicator'>
                        <ActivityIndicator size='large' color={THEME.accent} />
                    </View>
                ) : (
                    children
                )}
            </View>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
