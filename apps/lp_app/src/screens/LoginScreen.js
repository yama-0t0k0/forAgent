import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../features/firebase/config';
import { logCustomEvent, setAnalyticsUser, setAnalyticsUserProperties } from '../features/analytics';
import { getRedirectUrlForRole, redirectToApp } from '../utils/navigationHelper';
import { resolveUserRole } from '../features/firebase/authUtils';
import { THEME } from '@shared/src/core/theme/theme';

const ERROR_CODES = {
    USER_NOT_FOUND: 'auth/user-not-found',
    WRONG_PASSWORD: 'auth/wrong-password',
    INVALID_CREDENTIAL: 'auth/invalid-credential',
};

const PLATFORM_IOS = 'ios';

/**
 * Login Screen Component
 * @param {object} props - Component props
 * @param {object} props.navigation - Navigation object
 * @returns {JSX.Element} Login Screen
 */
const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handle login process
     */
    const handleLogin = async () => {
        console.log('[Login] handleLogin started', { email });
        if (!email || !password) {
            Alert.alert('エラー', 'メールアドレスとパスワードを入力してください。');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const role = await resolveUserRole(userCredential.user);
            
            console.log('[Login] Login successful, resolved role:', role);

            // Analytics Tracking
            await setAnalyticsUser(userCredential.user.uid);
            await setAnalyticsUserProperties({
                user_type: role || 'unknown'
            });
            await logCustomEvent('login', { method: 'email', role: role || 'unknown' });

            if (!role) {
                Alert.alert('ログイン成功', 'ログインには成功しましたが、ユーザー種別の取得に失敗しました。しばらく待ってから再試行してください。');
                navigation.goBack();
                return;
            }

            const url = getRedirectUrlForRole(role);
            if (!url) {
                Alert.alert('ログイン成功', 'ログインには成功しましたが、遷移先が判定できませんでした。');
                navigation.goBack();
                return;
            }

            await redirectToApp(role);
        } catch (error) {
            console.error('Login failed:', error);

            // Analytics Tracking (Failure)
            await logCustomEvent('login_failure', {
                method: 'email',
                error_code: error.code,
                error_message: error.message
            });

            let message = 'ログインに失敗しました。';
            if (error.code === ERROR_CODES.USER_NOT_FOUND ||
                error.code === ERROR_CODES.WRONG_PASSWORD ||
                error.code === ERROR_CODES.INVALID_CREDENTIAL) {
                message = 'メールアドレスまたはパスワードが正しくありません。';
            }
            Alert.alert('ログイン失敗', `${message}\n(${error.code})`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === PLATFORM_IOS ? 'padding' : 'height'}
                style={styles.content}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>← 戻る</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>管理者ログイン</Text>
                    <Text style={styles.subtitle}>LPアプリ管理用アカウントでログインしてください。</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>メールアドレス</Text>
                        <TextInput
                            style={styles.input}
                            placeholder='example@lat-inc.com'
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize='none'
                            keyboardType='email-address'
                            autoComplete='email'
                            placeholderTextColor={THEME.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>パスワード</Text>
                        <TextInput
                            style={styles.input}
                            placeholder='••••••••'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete='password'
                            placeholderTextColor={THEME.textMuted}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={THEME.textInverse} />
                        ) : (
                            <Text style={styles.loginButtonText}>ログイン</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        ※ 一般ユーザー向けの新規登録機能は現在提供されていません。
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 16, 
        paddingVertical: 8,
    },
    backButtonText: {
        color: THEME.primary,
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.textPrimary,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textSecondary,
        lineHeight: 24,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.textPrimary,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: THEME.borderDefault,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: THEME.textPrimary,
        backgroundColor: THEME.surfaceInput,
    },
    loginButton: {
        backgroundColor: THEME.primary,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonDisabled: {
        backgroundColor: THEME.borderLight,
        shadowOpacity: 0,
    },
    loginButtonText: {
        color: THEME.textInverse,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 24,
        paddingTop: 24,
    },
    footerText: {
        fontSize: 12,
        color: THEME.textMuted,
        textAlign: 'center', 
        lineHeight: 18,
    },
});

export default LoginScreen;
