// 役割（機能概要）:
// - LPアプリの LoginScreen におけるロール判定ユーティリティの単体テスト
// - ユーザーID先頭文字（A/B/C）から role を推定するロジックを検証
//
// 主要機能:
// - resolveRoleFromUserIdPrefix: A/B/C → admin/corporate/individual
// - extractUserIdCandidate: Firestore ドキュメント想定のデータからID候補を抽出
//
// ディレクトリ構造:
// - apps/lp_app/src/screens/LoginScreen.js (テスト対象)
// - apps/lp_app/src/screens/__tests__/LoginScreen.roleResolution.test.js (本ファイル)
//
// デプロイ・実行方法:
// - テスト: npx jest apps/lp_app/src/screens/__tests__/LoginScreen.roleResolution.test.js
// - まとめて: npx jest
jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaView: ({ children }) => children,
  };
});

jest.mock('react-native', () => ({
  StyleSheet: {
    create: (obj) => obj,
  },
  View: ({ children }) => children,
  Text: ({ children }) => children,
  TextInput: ({ children }) => children,
  TouchableOpacity: ({ children }) => children,
  ActivityIndicator: ({ children }) => children,
  Alert: { alert: jest.fn() },
  KeyboardAvoidingView: ({ children }) => children,
  Platform: { OS: 'web' },
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../../features/firebase/config', () => ({
  auth: {},
  db: {},
}));

jest.mock('../../features/analytics', () => ({
  logCustomEvent: jest.fn(),
  setAnalyticsUser: jest.fn(),
  setAnalyticsUserProperties: jest.fn(),
}));

jest.mock('../../utils/navigationHelper', () => ({
  getRedirectUrlForRole: jest.fn(),
  redirectToApp: jest.fn(),
}));

const { extractUserIdCandidate, resolveRoleFromUserIdPrefix } = require('../LoginScreen');

describe('LoginScreen role resolution helpers', () => {
  describe('resolveRoleFromUserIdPrefix', () => {
    it('should resolve admin/corporate/individual from A/B/C prefix', () => {
      expect(resolveRoleFromUserIdPrefix('A00001')).toBe('admin');
      expect(resolveRoleFromUserIdPrefix('B99999')).toBe('corporate');
      expect(resolveRoleFromUserIdPrefix('C12345')).toBe('individual');
    });

    it('should handle lowercase prefix', () => {
      expect(resolveRoleFromUserIdPrefix('a00001')).toBe('admin');
      expect(resolveRoleFromUserIdPrefix('b00001')).toBe('corporate');
      expect(resolveRoleFromUserIdPrefix('c00001')).toBe('individual');
    });

    it('should return null for invalid input', () => {
      expect(resolveRoleFromUserIdPrefix('')).toBeNull();
      expect(resolveRoleFromUserIdPrefix(null)).toBeNull();
      expect(resolveRoleFromUserIdPrefix('X00001')).toBeNull();
    });
  });

  describe('extractUserIdCandidate', () => {
    it('should pick first matching field in priority order', () => {
      const data = {
        userId: 'C00002',
        companyId: 'B00001',
      };

      expect(extractUserIdCandidate(data)).toBe('C00002');
    });

    it('should return null when no candidates exist', () => {
      expect(extractUserIdCandidate({})).toBeNull();
      expect(extractUserIdCandidate(null)).toBeNull();
    });
  });
});
