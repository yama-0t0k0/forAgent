/**
 * アプリケーションの共通テーマカラー定義
 */
export const THEME = {
  // Brand & Action
  primary: '#0EA5E9',
  primaryHover: '#0284C7',
  secondary: '#8B5CF6',
  
  // Background & Surface
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: 'rgba(255, 255, 255, 0.8)',
  surfaceInput: '#F1F5F9',
  surfaceMuted: '#F5F5F5',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  textLink: '#0EA5E9',

  // Status / Feedback
  success: '#10B981',
  surfaceSuccess: '#D1FAE5',
  textSuccess: '#047857',
  
  error: '#EF4444',
  surfaceError: '#FEE2E2',
  textError: '#991B1B',
  
  warning: '#F59E0B',
  surfaceWarning: '#FFFBE6',
  borderWarning: '#FFE58F',
  textWarning: '#856404',
  
  info: '#0EA5E9',
  surfaceInfo: '#E0F2FE',
  textInfo: '#0369A1',
  
  neutral: '#64748B',
  surfaceNeutral: '#F1F5F9',
  textNeutral: '#475569',
  borderNeutral: '#94A3B8',

  // Chart / Heatmap Colors
  chartLevel0: '#E2E8F0',
  chartLevel1: '#BAE6FD',
  chartLevel2: '#7DD3FC',
  chartLevel3: '#0EA5E9',
  chartLevel4: '#0369A1',

  // Border & Divider
  borderDefault: '#E2E8F0',
  borderLight: '#F0F0F0',
  borderGlass: '#E0F2FE',
  borderFocus: '#0EA5E9',

  // Legacy mappings for backward compatibility (Will be phased out)
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#1E293B',
  subText: '#64748B',
  accent: '#0EA5E9',
  secondaryAccent: '#8B5CF6',
  inputBg: '#F1F5F9',

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
    headingXl: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    headingLg: { fontSize: 28, fontWeight: '900', lineHeight: 34 },
    h1: { fontSize: 24, fontWeight: 'bold' },
    h2: { fontSize: 20, fontWeight: 'bold' },
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    bodySmall: { fontSize: 14, fontWeight: 'normal', lineHeight: 22 },
    caption: { fontSize: 14, fontWeight: 'normal', color: '#64748B' },
    small: { fontSize: 12, fontWeight: 'normal' },
    micro: { fontSize: 10, fontWeight: '800' },
    button: { fontSize: 14, fontWeight: '600' },
  },

  // UI Constants
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    pill: 22,
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

