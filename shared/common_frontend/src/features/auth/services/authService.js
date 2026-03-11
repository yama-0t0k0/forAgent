// 役割（機能概要）
// - 認証サービスモジュール
// - Firebase Authentication APIのラッパー
// - メール/パスワード認証およびPasskey（WebAuthn）認証の提供
//
// 主要機能:
// - メールアドレスとパスワードによるログイン
// - Passkey（WebAuthn）によるログイン（@firebase-web-authn/browser使用）
// - ログアウト機能
// - 現在のユーザー取得
// - 認証永続性の設定（browserLocalPersistence）
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/auth/services/authService.js (本ファイル)
// - 依存: firebase/auth, @firebase-web-authn/browser, @shared/src/core/firebaseConfig
//
// デプロイ・実行方法:
// - インポートして使用: import { authService } from '@shared/src/features/auth/services/authService';
// - テスト: npx jest shared/common_frontend/src/features/auth/services/authService.test.js

import { signInWithEmailAndPassword, signOut, browserLocalPersistence, setPersistence, signInWithCredential } from 'firebase/auth';
import { signInWithPasskey as firebaseSignInWithPasskey } from '@firebase-web-authn/browser';
import { auth, functions } from '@shared/src/core/firebaseConfig';

/**
 * Authentication Service
 * Wraps Firebase Auth methods for use in the application.
 */
export const authService = {
  /**
   * Sign in with Email and Password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<UserCredential>}
   */
  async signInWithEmailPassword(email, password) {
    try {
      console.log(`[AuthService] Attempting login: emailLength=${email?.length}, passwordLength=${password?.length}`);
      console.log(`[AuthService] Auth project: ${auth?.app?.options?.projectId}`);

      // Auth persistence is handled in firebaseConfig.js.
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthService] Login successful for UID:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('[AuthService] Login Error:', error.code, error.message);
      // Log more error details if available
      if (error.customData) console.error('[AuthService] Error Custom Data:', error.customData);
      throw error;
    }
  },

  /**
   * Sign in with Passkey (WebAuthn)
   * Note: This is a placeholder for Phase 1.1. 
   * Actual WebAuthn implementation requires domain association and specific browser support.
   * @param {object} [credential] - Optional credential object for testing or manual injection.
   * @returns {Promise<UserCredential>}
   */
  async signInWithPasskey(credential = null) {
    try {
      if (credential) {
        // If a credential is provided (e.g. from a separate WebAuthn flow or test), use it directly.
        return await signInWithCredential(auth, credential);
      }

      // Use @firebase-web-authn/browser to handle the WebAuthn flow
      // This requires the corresponding Firebase Extension to be installed and configured.
      return await firebaseSignInWithPasskey(auth, functions);
    } catch (error) {
      console.error('Passkey Login Error:', error.message);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  },

  /**
   * Get current user
   * @returns {User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  }
};
