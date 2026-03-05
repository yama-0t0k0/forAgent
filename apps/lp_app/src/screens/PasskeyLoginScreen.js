// 機能概要:
// - パスキー（Passkey / WebAuthn）によるログインのUIと処理を提供
// - 既存のEmail/Passwordログイン画面への遷移リンクを併設
// - Firebase Authentication を用いたパスキー認証（Web環境での実行を優先）
//
// 主要機能:
// - 「✨ パスキーでログイン」ボタンでパスキー認証フローを起動
// - 成功/失敗時のアナリティクス計測（login / login_failure）
// - 「Password でのログインはこちら」リンクでEmail/Password画面へ遷移
//
// ディレクトリ構造:
// - apps/lp_app/src/screens/PasskeyLoginScreen.js (本ファイル)
// - apps/lp_app/src/screens/LoginScreen.js (Email/Password)
// - apps/lp_app/src/features/firebase/config.js (Firebase初期化)
// - apps/lp_app/src/features/analytics/index.js (アナリティクス)
//
// デプロイ・実行方法:
// - Expo (React Native / Web) 上で動作
// - Webでのパスキー利用には HTTPS 環境とブラウザ対応が必要
// - 依存関係: '@firebase-web-authn/browser' を使用する場合はインストールが必要（Web推奨）

import React, { useState } from 'react';
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
   * - ネイティブ環境では未対応の場合アラート表示
   */
  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    try {
      const isWeb = Platform.OS === 'web';
      const isWebAuthnAvailable =
        typeof window !== 'undefined' && 'PublicKeyCredential' in window;

      if (!isWeb || !isWebAuthnAvailable) {
        Alert.alert('未対応の環境', 'この端末/環境ではパスキー認証が利用できません。');
        await logCustomEvent('login_failure', { method: 'passkey', error_code: 'unsupported_environment' });
        return;
      }

      // 動的インポートでライブラリ存在チェックを兼ねる
      const webAuthn = await import('@firebase-web-authn/browser');
      if (!webAuthn || typeof webAuthn.signInWithPasskey !== 'function') {
        throw new Error('signInWithPasskey_unavailable');
      }

      const userCredential = await webAuthn.signInWithPasskey(auth, functions);

      await setAnalyticsUser(userCredential.user.uid);
      await setAnalyticsUserProperties({ user_type: 'admin' });
      await logCustomEvent('login', { method: 'passkey' });

      navigation.goBack();
    } catch (error) {
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
              <ActivityIndicator color="#fff" />
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
});

export default PasskeyLoginScreen;
