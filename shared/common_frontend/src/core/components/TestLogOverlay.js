import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { FirestoreLogger } from '../utils/FirestoreLogger';
import { THEME } from '@shared/src/core/theme/theme';

const MAX_LOGS = 5;

/**
 * Overlay component to display Firestore I/O logs for Maestro to detect.
 * Visible only in __DEV__ mode.
 * Positioned absolutely to avoid layout shifts, but "visible" to accessibility/Maestro.
 */
export const TestLogOverlay = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (!__DEV__) return;

        const subscription = DeviceEventEmitter.addListener(
            FirestoreLogger.EVENT_NAME,
            (logString) => {
                setLogs((prev) => {
                    // Keep only last 5 logs to prevent memory issues
                    const newLogs = [...prev, logString];
                    if (newLogs.length > MAX_LOGS) return newLogs.slice(newLogs.length - MAX_LOGS);
                    return newLogs;
                });
            }
        );

        return () => {
            subscription.remove();
        };
    }, []);

    if (!__DEV__) return null;

    return (
        <View style={styles.container} pointerEvents='none'>
            {logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                    {log}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: THEME.surfaceInvisible,
        zIndex: 9999,
        maxHeight: 100,
        overflow: 'hidden',
    },
    logText: {
        fontSize: 8,
        color: THEME.surfaceInvisible,
        width: '100%',
    },
});
