import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, functions, db } from '@shared/src/core/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { Passkey } from 'react-native-passkey';
import { THEME } from '@shared/src/core/theme/theme';

/**
 * Passkey Management Section
 * 
 * A reusable component that displays the passkey status and allows registration/verification.
 * Intended to be embedded within profile/menu screens.
 */
export const PasskeyManagementSection = () => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', null

    useEffect(() => {
        checkPasskeyStatus();
    }, []);

    /**
     * Checks if the user has any registered passkeys in Firestore
     */
    const checkPasskeyStatus = async () => {
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const passkeysRef = collection(db, 'users', user.uid, 'passkeys');
            const q = query(passkeysRef, limit(1));
            const snapshot = await getDocs(q);
            setIsRegistered(!snapshot.empty);
        } catch (error) {
            console.error('Error checking passkey status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles Passkey Registration
     */
    const handleRegister = async () => {
        const isSupported = Passkey.isSupported();
        if (!isSupported) {
            Alert.alert('非対応端末', 'この端末はパスキーに対応していません。');
            return;
        }

        setIsActionLoading(true);
        setVerificationStatus(null);
        try {
            const getOptions = httpsCallable(functions, 'getPasskeyRegistrationOptions');
            const verifyRegistration = httpsCallable(functions, 'verifyPasskeyRegistration');

            // 1. Get options from server
            const optionsResult = await getOptions();
            const options = optionsResult.data;

            // 2. Create passkey on device
            const registrationResponse = await Passkey.create(options);

            // 3. Verify on server
            await verifyRegistration({ response: registrationResponse });

            Alert.alert('登録完了', 'パスキーを登録しました。次からパスキーでログインできます。');
            setIsRegistered(true);
        } catch (error) {
            console.error('Passkey Registration Error:', error);
            Alert.alert('登録失敗', 'パスキーの登録中にエラーが発生しました。');
        } finally {
            setIsActionLoading(false);
        }
    };

    /**
     * Handles Passkey Verification (Test Login)
     */
    const handleVerify = async () => {
        setIsActionLoading(true);
        setVerificationStatus(null);
        try {
            const getChallenge = httpsCallable(functions, 'getPasskeyChallenge');
            const verifyPasskey = httpsCallable(functions, 'verifyPasskeyAndGetToken');

            // 1. Get challenge from server
            const challengeResult = await getChallenge();
            const { challenge, rpId, allowCredentials } = challengeResult.data;

            // 2. Authenticate on device
            const authResponse = await Passkey.authenticate({
                challenge,
                rpId,
                allowCredentials: Array.isArray(allowCredentials) ? allowCredentials : [],
            });

            // 3. Verify on server
            await verifyPasskey({ response: authResponse });

            setVerificationStatus('success');
            Alert.alert('検証成功', 'パスキーによる認証が正常に確認されました。');
        } catch (error) {
            console.error('Passkey Verification Error:', error);
            setVerificationStatus('error');
            Alert.alert('検証失敗', 'パスキーの認証に失敗しました。再度お試しください。');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={THEME.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>パスキー管理</Text>
            <View style={styles.card}>
                <View style={styles.statusRow}>
                    <View style={styles.statusLabelContainer}>
                        <Ionicons
                            name={isRegistered ? 'key' : 'key-outline'}
                            size={20}
                            color={isRegistered ? '#10B981' : THEME.subText}
                        />
                        <Text style={styles.statusLabel}>ステータス</Text>
                    </View>
                    <View style={[styles.badge, isRegistered ? styles.badgeRegistered : styles.badgeUnregistered]}>
                        <Text style={[styles.badgeText, isRegistered ? styles.badgeTextRegistered : styles.badgeTextUnregistered]}>
                            {isRegistered ? '登録済み' : '未登録'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionContainer}>
                    {!isRegistered ? (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleRegister}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="finger-print-outline" size={20} color="#FFF" style={styles.buttonIcon} />
                                    <Text style={styles.buttonText}>🔑 パスキーを登録する</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View>
                            <Text style={styles.infoText}>
                                このデバイスまたはアカウントにパスキーが登録されています。
                            </Text>
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={handleVerify}
                                disabled={isActionLoading}
                            >
                                {isActionLoading ? (
                                    <ActivityIndicator color={THEME.primary} />
                                ) : (
                                    <>
                                        <Ionicons
                                            name={verificationStatus === 'success' ? 'checkmark-circle' : 'shield-checkmark-outline'}
                                            size={20}
                                            color={verificationStatus === 'success' ? '#10B981' : THEME.primary}
                                            style={styles.buttonIcon}
                                        />
                                        <Text style={[styles.secondaryButtonText, verificationStatus === 'success' && { color: '#10B981' }]}>
                                            {verificationStatus === 'success' ? '検証済み' : '今すぐパスキーログインを試す（検証）'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reRegisterLink}
                                onPress={handleRegister}
                                disabled={isActionLoading}
                            >
                                <Text style={styles.reRegisterLinkText}>別のパスキーを追加で登録</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME.subText,
        marginBottom: 8,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: THEME.cardBg,
        borderRadius: 16,
        padding: 16,
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
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: THEME.text,
        marginLeft: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeRegistered: {
        backgroundColor: '#D1FAE5',
    },
    badgeUnregistered: {
        backgroundColor: '#F1F5F9',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    badgeTextRegistered: {
        color: '#059669',
    },
    badgeTextUnregistered: {
        color: '#64748B',
    },
    actionContainer: {
        marginTop: 4,
    },
    infoText: {
        fontSize: 13,
        color: THEME.subText,
        marginBottom: 16,
        lineHeight: 18,
    },
    button: {
        height: 48,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: THEME.primary,
        // Vibrant primary color
    },
    secondaryButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: THEME.primary,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: THEME.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    reRegisterLink: {
        marginTop: 12,
        alignItems: 'center',
    },
    reRegisterLinkText: {
        fontSize: 13,
        color: THEME.subText,
        textDecorationLine: 'underline',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    }
});
