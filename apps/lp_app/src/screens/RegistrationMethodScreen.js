import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../features/firebase/config';
import { 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithPopup, 
    signInWithRedirect 
} from 'firebase/auth';

import registrationService from '@shared/src/features/registration/services/registrationService';
import { THEME } from '@shared/src/core/theme/theme';

const { width } = Dimensions.get('window');

/**
 * Registration Method Selection Screen (Step 3)
 * Premium Antigravity Design
 * Choice: Google, GitHub, or Email
 */
const RegistrationMethodScreen = ({ navigation, route }) => {
    const { invitationInfo } = route.params || {};
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSelectMethod = async (method) => {
        if (method === 'email') {
            navigation.navigate('RegistrationForm', { 
                invitationInfo,
                authMethod: method 
            });
            return;
        }

        setIsLoading(true);
        try {
            let provider = null;
            if (method === 'google') {
                provider = new GoogleAuthProvider();
            } else if (method === 'github') {
                provider = new GithubAuthProvider();
            }

            if (Platform.OS === 'web') {
                const result = await signInWithPopup(auth, provider);
                console.log(`[Method] Social Auth Success: ${result.user.email}`);
                
                // Check for draft
                const draft = await registrationService.getRegistrationDraft(result.user.uid);
                if (draft) {
                    Alert.alert(
                        '登録の再開',
                        '以前の登録データが見つかりました。中断した場所から再開しますか？',
                        [
                            { 
                                text: '最初から', 
                                style: 'cancel',
                                onPress: () => navigation.navigate('RegistrationForm', { invitationInfo, authMethod: method })
                            },
                            { 
                                text: '再開する', 
                                onPress: () => navigation.navigate('RegistrationForm', { 
                                    invitationInfo, 
                                    authMethod: method,
                                    resumeData: draft.formData
                                })
                            }
                        ]
                    );
                } else {
                    navigation.navigate('RegistrationForm', { 
                        invitationInfo,
                        authMethod: method 
                    });
                }
            } else {
                // For Native: signInWithRedirect is the standard for Expo
                // Note: Requires extra config in app.json for deep linking
                Alert.alert(
                    'Social Auth', 
                    'Mobile環境でのSocial Loginには追加設定が必要です。Emailでの登録をお試しください。',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('[Method] Auth Error:', error);
            Alert.alert('認証エラー', '外部サービスとの連携に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← 戻る</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.titleArea}>
                    <Text style={styles.welcomeText}>Welcome to LAT</Text>
                    <Text style={styles.title}>アカウント作成方法を選択</Text>
                    <Text style={styles.subtitle}>
                        {invitationInfo?.type === 'corporate' ? '法人担当者' : '個人'}アカウントとして{"\n"}
                        登録を継続します。
                    </Text>
                </View>

                <View style={styles.buttonStack}>
                    {/* Google Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.googleButton]} 
                        onPress={() => handleSelectMethod('google')}
                    >
                        <View style={styles.iconPlaceholder}>
                            <Text style={styles.iconText}>G</Text>
                        </View>
                        <Text style={[styles.methodButtonText, styles.googleButtonText]}>Google で登録</Text>
                    </TouchableOpacity>

                    {/* GitHub Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.githubButton]} 
                        onPress={() => handleSelectMethod('github')}
                    >
                        <View style={styles.iconPlaceholderDark}>
                            <Text style={styles.iconTextWhite}>Git</Text>
                        </View>
                        <Text style={styles.methodButtonText}>GitHub で登録</Text>
                    </TouchableOpacity>

                    <View style={styles.separator}>
                        <View style={styles.line} />
                        <Text style={styles.separatorText}>または</Text>
                        <View style={styles.line} />
                    </View>

                    {/* Email Button */}
                    <TouchableOpacity 
                        style={[styles.methodButton, styles.emailButton]} 
                        onPress={() => handleSelectMethod('email')}
                    >
                        <Text style={styles.methodButtonText}>メールアドレスで登録</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        登録を進めることで、利用規約および{"\n"}
                        個人情報保護方針に同意したものとみなされます。
                    </Text>
                </View>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={THEME.primary} />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    header: {
        height: 60,
        paddingHorizontal: THEME.spacing.md,
        justifyContent: 'center',
    },
    backButton: {
        paddingVertical: THEME.spacing.xs,
    },
    backButtonText: {
        color: THEME.textMuted,
        fontSize: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: THEME.spacing.lg,
        justifyContent: 'center',
    },
    titleArea: {
        marginBottom: THEME.spacing.xl * 1.5,
    },
    welcomeText: {
        color: THEME.accent,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: THEME.spacing.xs,
    },
    title: {
        color: THEME.textInverse,
        fontSize: 28,
        fontWeight: '800',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        color: THEME.textSecondary,
        fontSize: 16,
        lineHeight: 24,
    },
    buttonStack: {
        gap: THEME.spacing.md,
    },
    methodButton: {
        height: 60,
        borderRadius: THEME.radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.md,
        backgroundColor: THEME.surfaceElevated,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
    },
    googleButton: {
        backgroundColor: THEME.textInverse,
        borderColor: THEME.textInverse,
    },
    googleButtonText: {
        color: THEME.textPrimary, 
    },
    githubButton: {
        backgroundColor: THEME.surfaceElevated,
        borderColor: THEME.borderDefault,
    },
    emailButton: {
        backgroundColor: THEME.accent,
        borderColor: THEME.accent,
        justifyContent: 'center',
    },
    methodButtonText: {
        color: THEME.textInverse,
        fontSize: 17,
        fontWeight: '600',
        marginLeft: THEME.spacing.md,
    },
    iconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconPlaceholderDark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: THEME.borderDefault,
        justifyContent: 'center',
        alignItems: 'center', 
    },
    iconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.primary,
    },
    iconTextWhite: {
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.textInverse,
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: THEME.spacing.lg,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: THEME.borderDefault,
    },
    separatorText: {
        color: THEME.textMuted,
        marginHorizontal: THEME.spacing.md,
        fontSize: 14,
    },
    footer: {
        marginTop: THEME.spacing.xl * 1.5,
    },
    footerText: {
        color: THEME.textMuted,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18, 
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.overlayDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegistrationMethodScreen;
