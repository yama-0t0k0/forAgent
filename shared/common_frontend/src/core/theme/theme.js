/**
 * アプリケーションの共通テーマカラー定義
 */
export const THEME = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#1E293B',
  subText: '#64748B',
  primary: '#0EA5E9',
  accent: '#0EA5E9',
  secondaryAccent: '#8B5CF6',
  inputBg: '#F1F5F9',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Typography System
  typography: {
    h1: { fontSize: 24, fontWeight: 'bold' },
    h2: { fontSize: 20, fontWeight: 'bold' },
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal', color: '#64748B' },
    small: { fontSize: 12, fontWeight: 'normal' },
  },

  // UI Constants
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  }
};
