import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { auth, functions, db } from '../features/firebase/config';
import { logCustomEvent, setAnalyticsUser, setAnalyticsUserProperties } from '../features/analytics';
import { Passkey } from 'react-native-passkey';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { redirectToApp } from '../utils/navigationHelper';
import { THEME } from '@shared/src/core/theme/theme';

const PLATFORM_WEB = 'web';
const TYPE_UNDEFINED = 'undefined';
const TYPE_FUNCTION = 'function';

const DEFAULT_PASSKEY_RP_ID_PROD = 'latcoltd.net';
const DEFAULT_PASSKEY_RP_ID_DEV = 'engineer-registration-lp-dev.web.app';
const DEFAULT_PASSKEY_RP_ID = __DEV__ ? DEFAULT_PASSKEY_RP_ID_DEV : DEFAULT_PASSKEY_RP_ID_PROD;
const DESIRED_PASSKEY_RP_ID = process.env.EXPO_PUBLIC_PASSKEY_RP_ID || DEFAULT_PASSKEY_RP_ID;
const ROLE_BY_ID_PREFIX = {
  A: 'admin',
  B: 'corporate',
  C: 'individual',
};

// WebAuthn library for Web
let webAuthn = null;
if (Platform.OS === PLATFORM_WEB) {
  import('@firebase-web-authn/browser').then((module) => {
    webAuthn = module;
  });
}

const PLATFORM_IOS = 'ios';

/**
 * Passkey Login Screen
 * @param {object} props
 * @param {object} props.navigation
 * @returns {JSX.Element}
 */
const PasskeyLoginScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const resolveRoleFromUserIdPrefix = (userId) => {
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return null;
    }

    const prefix = userId.trim().charAt(0).toUpperCase();
    return ROLE_BY_ID_PREFIX[prefix] || null;
  };

  const fetchRoleFromFirestore = async (uid) => {
    try {
      const userDocSnap = await getDoc(doc(db, 'users', uid));
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (typeof data?.role === 'string' && data.role.trim().length > 0) {
          return data.role.trim();
        }
      }
    } catch (e) {
      console.error('[PasskeyLogin] Error fetching users doc:', e);
    }

    try {
      const legacyUserDocSnap = await getDoc(doc(db, 'Users', uid));
      if (legacyUserDocSnap.exists()) {
        const data = legacyUserDocSnap.data();
        if (typeof data?.role === 'string' && data.role.trim().length > 0) {
          return data.role.trim();
        }
      }
    } catch (e) {
      console.error('[PasskeyLogin] Error fetching Users doc:', e);
    }

    return null;
  };

  /**
   * パスキー認証を実行
   * - Web環境では '@firebase-web-authn/browser' を利用
   * - ネイティブ環境では 'react-native-passkey' を利用
   */
  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === PLATFORM_WEB) {
        await handleWebPasskeyLogin();
      } else {
        await handleNativePasskeyLogin();
      }
    } catch (error) {
      console.error('Passkey Login Error:', error);
      await logCustomEvent('login_failure', {
        method: 'passkey',
        error_code: error?.code || 'passkey_error',
        error_message: error?.message || String(error),
      });
      Alert.alert('ログイン失敗', 'パスキー認証に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Web Passkey Login
   * @returns {Promise<void>}
   */
  const handleWebPasskeyLogin = async () => {
    const isWebAuthnAvailable =
      typeof window !== TYPE_UNDEFINED && 'PublicKeyCredential' in window;

    if (!isWebAuthnAvailable) {
      throw new Error('WebAuthn is not supported in this browser.');
    }

    if (!webAuthn || typeof webAuthn.signInWithPasskey !== TYPE_FUNCTION) {
      throw new Error('WebAuthn library is not loaded.');
    }

    const userCredential = await webAuthn.signInWithPasskey(auth, functions);
    await handleLoginSuccess(userCredential);
  };

  /**
   * Handle Native Passkey Login
   * @returns {Promise<void>}
   */
  const handleNativePasskeyLogin = async () => {
    const isSupported = Passkey.isSupported();
    if (!isSupported) {
      throw new Error('Passkeys are not supported on this device.');
    }

    const getChallenge = httpsCallable(functions, 'getPasskeyChallenge');
    const verifyResponse = httpsCallable(functions, 'verifyPasskeyAndGetToken');

    const options = await getChallenge({ rpId: DESIRED_PASSKEY_RP_ID });
    const data = options.data || {};
    const rpId = data.rpId || data.rpID;
    const { challenge, allowCredentials } = data;
    if (!rpId || !challenge) {
      throw new Error('Invalid challenge options');
    }

    const result = await Passkey.authenticate({
      rpId,
      challenge,
      allowCredentials: Array.isArray(allowCredentials) ? allowCredentials : [],
    });

    const verify = await verifyResponse({ response: result });
    const { customToken } = verify.data || {};
    if (!customToken) {
      throw new Error('Custom token not returned');
    }

    const userCredential = await signInWithCustomToken(auth, customToken);
    await handleLoginSuccess(userCredential);
  };

  /**
   * Handle Login Success
   * @param {object} userCredential - Firebase user credential
   * @returns {Promise<void>}
   */
  const handleLoginSuccess = async (userCredential) => {
    // Analytics Tracking
    await setAnalyticsUser(userCredential.user.uid);
    
    // Get role from ID token
    const idTokenResult = await userCredential.user.getIdTokenResult();
    let role = idTokenResult?.claims?.role || null;

    if (!role) {
      role = resolveRoleFromUserIdPrefix(userCredential.user.uid);
    }

    if (!role) {
      role = await fetchRoleFromFirestore(userCredential.user.uid);
    }

    await setAnalyticsUserProperties({ user_type: role || 'unknown' });
    await logCustomEvent('login', { method: 'passkey', role });

    if (role) {
      await redirectToApp(role);
    } else {
      // Fallback for users without role (or if redirect fails/is not applicable)
      navigation.goBack();
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
          <Text style={styles.title}>ログイン</Text>
          <Text style={styles.subtitle}>パスキーで安全かつ素早くログインできます。</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handlePasskeyLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.textInverse} />
            ) : (
              <Text style={styles.loginButtonText}>✨ パスキーでログイン</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passwordLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.passwordLinkText}>Password でのログインはこちら</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16, 
    color: THEME.primary,
  },
  header: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
  },
  form: {
    marginTop: 16,
  },
  loginButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: THEME.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  passwordLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  passwordLinkText: {
    color: THEME.primary,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.overlayLight,
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.textPrimary,
  },
});

export default PasskeyLoginScreen;
