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
import { auth, functions } from '../features/firebase/config';
import { logCustomEvent, setAnalyticsUser, setAnalyticsUserProperties } from '../features/analytics';
import { Passkey } from 'react-native-passkey';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { redirectToApp } from '../utils/navigationHelper';

const PLATFORM_WEB = 'web';
const TYPE_UNDEFINED = 'undefined';
const TYPE_FUNCTION = 'function';

const DEFAULT_PASSKEY_RP_ID_PROD = 'latcoltd.net';
const DEFAULT_PASSKEY_RP_ID_DEV = 'engineer-registration-lp-dev.web.app';
const DEFAULT_PASSKEY_RP_ID = __DEV__ ? DEFAULT_PASSKEY_RP_ID_DEV : DEFAULT_PASSKEY_RP_ID_PROD;
const DESIRED_PASSKEY_RP_ID = process.env.EXPO_PUBLIC_PASSKEY_RP_ID || DEFAULT_PASSKEY_RP_ID;

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
    const role = idTokenResult.claims.role;

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
              <ActivityIndicator color='#fff' />
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
    backgroundColor: '#fff',
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
    color: '#007AFF',
  },
  header: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
  },
  form: {
    marginTop: 16,
  },
  loginButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  passwordLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default PasskeyLoginScreen;
