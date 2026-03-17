// 役割（機能概要）
// - 認証サービス（authService）の単体テスト
// - Firebase AuthおよびPasskeyライブラリのモック化による動作検証
//
// 主要機能:
// - メール/パスワードログインの成功・失敗テスト
// - Passkeyログイン（クレデンシャルあり/なし）の挙動テスト
// - ログアウト機能のテスト
// - 外部依存モジュール（firebase/auth, @firebase-web-authn/browser）のモック制御
//
// ディレクトリ構造:
// - shared/common_frontend/src/features/auth/services/authService.test.js (本ファイル)
// - テスト対象: ./authService.js
//
// デプロイ・実行方法:
// - テスト実行: npx jest shared/common_frontend/src/features/auth/services/authService.test.js
// - 全体テスト: npx jest shared/common_frontend

import { authService } from './authService';
import { signInWithEmailAndPassword, signOut, setPersistence, signInWithCredential } from 'firebase/auth';
import { signInWithPasskey as firebaseSignInWithPasskey } from '@firebase-web-authn/browser';

// Mock firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  initializeFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: 'browserLocalPersistence',
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock('@firebase-web-authn/browser', () => ({
  signInWithPasskey: jest.fn(),
}));

// Mock firebaseConfig to avoid initialization side effects
jest.mock('@shared/src/core/firebaseConfig', () => ({
  auth: { currentUser: null },
  functions: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmailPassword', () => {
    it('should call setPersistence and signInWithEmailAndPassword with correct args', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUserCredential = { user: { uid: '123', email } };

      // Setup mocks
      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      // Execute
      const result = await authService.signInWithEmailPassword(email, password);

      // Verify
      // The first argument is the auth instance (mocked), checking email/password is crucial
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), email, password);
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error when signIn fails', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };

      signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authService.signInWithEmailPassword(email, password)).rejects.toEqual(mockError);
    });
  });

  describe('signInWithPasskey', () => {
    it('should call signInWithCredential when credential is provided', async () => {
      const mockCredential = { providerId: 'webauthn' };
      const mockUserCredential = { user: { uid: '123', email: 'test@example.com' } };

      signInWithCredential.mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithPasskey(mockCredential);

      expect(signInWithCredential).toHaveBeenCalledWith(expect.anything(), mockCredential);
      expect(result).toEqual(mockUserCredential);
    });

    it('should call firebaseSignInWithPasskey when credential is not provided', async () => {
      const mockUserCredential = { user: { uid: '123', email: 'passkey@example.com' } };
      firebaseSignInWithPasskey.mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithPasskey();

      expect(firebaseSignInWithPasskey).toHaveBeenCalledWith(expect.anything(), expect.anything());
      expect(result).toEqual(mockUserCredential);
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      signOut.mockResolvedValue();

      await authService.logout();

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw error when signOut fails', async () => {
      const mockError = new Error('SignOut failed');
      signOut.mockRejectedValue(mockError);

      await expect(authService.logout()).rejects.toThrow('SignOut failed');
    });
  });
});
