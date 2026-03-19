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
import { auth, db } from '../features/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { logCustomEvent, setAnalyticsUser, setAnalyticsUserProperties } from '../features/analytics';
import { getRedirectUrlForRole, redirectToApp } from '../utils/navigationHelper';

const ERROR_CODES = {
    USER_NOT_FOUND: 'auth/user-not-found',
    WRONG_PASSWORD: 'auth/wrong-password',
    INVALID_CREDENTIAL: 'auth/invalid-credential',
};

const PLATFORM_IOS = 'ios';
const ROLE_BY_ID_PREFIX = {
    A: 'admin',
    B: 'corporate',
    C: 'individual',
};

export const resolveRoleFromUserIdPrefix = (userId) => {
    if (typeof userId !== 'string' || userId.trim().length === 0) {
        return null;
    }

    const prefix = userId.trim().charAt(0).toUpperCase();
    return ROLE_BY_ID_PREFIX[prefix] || null;
};

export const extractUserIdCandidate = (data) => {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const idCandidates = [
        data.id,
        data.userId,
        data.companyId,
        data.id_company,
        data.id_individual,
    ];

    return idCandidates.find((value) => typeof value === 'string' && value.trim().length > 0) || null;
};

const fetchUserDocData = async (uid) => {
    try {
        const userDocSnap = await getDoc(doc(db, 'users', uid));
        if (userDocSnap.exists()) {
            return userDocSnap.data();
        }
    } catch (e) {
        console.error('[Login] Error fetching users doc:', e);
    }

    try {
        const legacyUserDocSnap = await getDoc(doc(db, 'Users', uid));
        if (legacyUserDocSnap.exists()) {
            return legacyUserDocSnap.data();
        }
    } catch (e) {
        console.error('[Login] Error fetching Users doc:', e);
    }

    return null;
};

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
            const idTokenResult = await userCredential.user.getIdTokenResult();
            let role = idTokenResult?.claims?.role || null;

            if (!role) {
                role = resolveRoleFromUserIdPrefix(userCredential.user.uid);
                if (role) {
                    console.log('[Login] Role resolved from uid prefix:', { uid: userCredential.user.uid, role });
                }
            }

            // Fallback: If no role in claims/id prefix, check Firestore 'users' collection
            if (!role) {
                console.log('[Login] No role in claims, checking Firestore users collection...');
                const userDocData = await fetchUserDocData(userCredential.user.uid);
                if (userDocData && typeof userDocData.role === 'string' && userDocData.role.length > 0) {
                    role = userDocData.role;
                    console.log('[Login] Role found in Firestore (users/Users):', role);
                } else if (userDocData) {
                    const userIdCandidate = extractUserIdCandidate(userDocData);
                    role = resolveRoleFromUserIdPrefix(userIdCandidate);
                    if (role) {
                        console.log('[Login] Role resolved from userId prefix:', { userIdCandidate, role });
                    }
                }
            }

            if (!role) {
                try {
                    const publicProfileSnap = await getDoc(doc(db, 'public_profile', userCredential.user.uid));
                    if (publicProfileSnap.exists()) {
                        const publicProfileData = publicProfileSnap.data();
                        const userIdCandidate = extractUserIdCandidate(publicProfileData);
                        role = resolveRoleFromUserIdPrefix(userIdCandidate);
                        if (role) {
                            console.log('[Login] Role resolved from public_profile userId prefix:', { userIdCandidate, role });
                        }
                    }
                } catch (firestoreError) {
                    console.error('[Login] Error fetching public_profile:', firestoreError);
                }
            }
            
            console.log('[Login] Login successful, role:', role);

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
                            placeholderTextColor='#999'
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
                            placeholderTextColor='#999'
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color='#fff' />
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
        backgroundColor: '#fff',
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
        color: '#007AFF',
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
        color: '#333',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
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
        color: '#333',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    loginButtonText: {
        color: '#fff',
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
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default LoginScreen;
