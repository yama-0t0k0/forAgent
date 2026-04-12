// 役割（機能概要）
// - ユーザーログイン画面コンポーネント
// - Passkey（生体認証）を第一優先としたログインフローの提供
// - 従来のメール/パスワード認証へのフォールバック機能
//
// 主要機能:
// - Passkeyログイン実行（authService.signInWithPasskey呼び出し）
// - メール/パスワード入力フォームとログイン実行
// - 入力バリデーションとエラーハンドリング表示
// - レスポンシブなUI（キーボード回避、セーフエリア対応）
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/auth/screens/SignInScreen.js (本ファイル)
// - 依存: authService, @shared/src/core/theme, @shared/src/core/components
//
// デプロイ・実行方法:
// - 画面として利用: NavigationContainer内でルートとして定義
// - 開発実行: bash scripts/start_expo.sh auth_portal

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '@shared/src/core/theme/theme';
import { PrimaryButton } from '@shared/src/core/components/PrimaryButton';
import { SecondaryButton } from '@shared/src/core/components/SecondaryButton';

import { authService } from '../services/authService';

/**
 * SignInScreen
 * 
 * Implements Phase 1.1 of Admin Login Architecture.
 * - Passkey-first login UI
 * - Password fallback UI
 * @returns {JSX.Element} The rendered SignInScreen component.
 */
export const SignInScreen = () => {
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const PLATFORM_IOS = 'ios';

  /**
   * Handle Passkey Login
   * Initiates the WebAuthn flow via authService.
   */
  const handlePasskeyLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithPasskey();
    } catch (error) {
      console.error(error);
      Alert.alert('Not Available', error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Password Login
   * Authenticates using email and password fallback.
   */
  const handlePasswordLogin = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    setLoading(true);
    try {
      await authService.signInWithEmailPassword(email, password);
      // Login success logic will be handled by onAuthStateChanged listener in App.js
      // But we can show a temporary success message here
      console.log('Login successful');
    } catch (error) {
      console.error(error);
      let errorMessage = 'ログインに失敗しました。';
      
      const AUTH_ERRORS = {
        INVALID_EMAIL: 'auth/invalid-email',
        USER_NOT_FOUND: 'auth/user-not-found',
        WRONG_PASSWORD: 'auth/wrong-password',
        TOO_MANY_REQUESTS: 'auth/too-many-requests',
      };

      if (error.code === AUTH_ERRORS.INVALID_EMAIL) errorMessage = 'メールアドレスの形式が正しくありません。';
      if (error.code === AUTH_ERRORS.USER_NOT_FOUND) errorMessage = 'ユーザーが見つかりません。';
      if (error.code === AUTH_ERRORS.WRONG_PASSWORD) errorMessage = 'パスワードが間違っています。';
      if (error.code === AUTH_ERRORS.TOO_MANY_REQUESTS) errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください。';
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const KEYBOARD_BEHAVIOR = Platform.OS === PLATFORM_IOS ? 'padding' : 'height';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={KEYBOARD_BEHAVIOR}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Career Architecture Platform</Text>
            <Text style={styles.subtitle}>当サービスは完全招待制の会員サービスです</Text>
          </View>

          <View style={styles.card}>
            {!isPasswordMode ? (
              // Passkey Mode (Default)
              <View style={styles.modeContainer}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>🔑</Text>
                </View>
                
                <Text style={styles.instructionText}>
                  生体認証（Touch ID / Face ID）または{'\n'}セキュリティキーを使用して安全にログインします。
                </Text>
                
                <PrimaryButton
                  title={'✨ Passkeyでログイン'}
                  onPress={handlePasskeyLogin}
                  loading={loading}
                  style={styles.mainButton}
                  textStyle={styles.mainButtonText}
                  useGradient={true}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>または</Text>
                  <View style={styles.divider} />
                </View>

                <SecondaryButton
                  title={'パスワードまたはメールでログイン'}
                  onPress={() => setIsPasswordMode(true)}
                  style={styles.secondaryButton}
                />
              </View>
            ) : (
              // Password Mode (Fallback)
              <View style={styles.modeContainer}>
                <Text style={styles.sectionTitle}>メールアドレスでログイン</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>メールアドレス</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={'admin@example.com'}
                    placeholderTextColor={THEME.textMuted}
                    autoCapitalize={'none'}
                    keyboardType={'email-address'}
                    testID={'email_input'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>パスワード</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={'••••••••'}
                    placeholderTextColor={THEME.textMuted}
                    secureTextEntry
                    testID={'password_input'}
                  />
                </View>

                <PrimaryButton
                  title={'ログイン'}
                  onPress={handlePasswordLogin}
                  loading={loading}
                  style={styles.mainButton}
                  disabled={!email || !password}
                />

                <SecondaryButton
                  title={'← Passkeyでログインに戻る'}
                  onPress={() => setIsPasswordMode(false)}
                  style={styles.backButton}
                  textStyle={styles.backButtonText}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...THEME.typography.headingLg,
    color: THEME.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...THEME.typography.body,
    color: THEME.textSecondary,
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: THEME.radius.lg,
    padding: 32,
    ...THEME.shadow.md,
    maxWidth: 480, // Limit width on large screens
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: THEME.borderDefault,
  },
  modeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.surfaceInfo,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...THEME.shadow.sm, // Subtle glow effect
  },
  iconText: {
    fontSize: 40,
  },
  instructionText: {
    ...THEME.typography.body,
    color: THEME.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  mainButton: {
    width: '100%',
    marginBottom: 24,
    height: 50,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: THEME.borderDefault,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.borderDefault,
  },
  dividerText: {
    marginHorizontal: 16,
    color: THEME.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    ...THEME.typography.h2,
    color: THEME.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    ...THEME.typography.caption,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: THEME.borderDefault,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 16,
    ...THEME.typography.body,
    backgroundColor: THEME.surfaceInput,
    color: THEME.textPrimary,
  },
  backButton: {
    marginTop: 8,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
});
