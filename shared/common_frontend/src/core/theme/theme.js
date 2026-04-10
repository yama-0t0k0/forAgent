/**
 * アプリケーションの共通デザインシステム定数
 * Industry 2.0 基準のセマンティックトークンを定義します。
 */

const PALETTE = {
    sky: { 50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC', 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1', 800: '#075985', 900: '#0C4A6E' },
    slate: { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A' },
    violet: { 500: '#8B5CF6', 600: '#7C3AED' },
    emerald: { 50: '#ECFDF5', 500: '#10B981', 700: '#047857' },
    rose: { 50: '#FFF1F2', 500: '#F43F5E', 800: '#9F1239' },
    amber: { 50: '#FFFBEB', 500: '#F59E0B', 800: '#92400E' },
};

export const THEME = {
    // --- Base Brand Colors ---\n    primary: PALETTE.sky[500],
    primaryHover: PALETTE.sky[600],
    secondary: PALETTE.violet[500],

    // --- Semantic Surface Tokens ---
    background: PALETTE.slate[50], // Default (Personal)
    surface: '#FFFFFF',
    surfaceElevated: 'rgba(255, 255, 255, 0.8)',
    surfaceInput: PALETTE.slate[100],
    surfaceMuted: PALETTE.slate[200],
    surfaceGlass: 'rgba(255, 255, 255, 0.4)',

    // --- App Specific Nuances (Subtle variations per user request) ---
    app: {
        personal: {
            background: PALETTE.slate[50],
            primary: PALETTE.sky[500],
        },
        corporate: {
            // More formal/professional tone
            background: '#F1F5F9',
            primary: PALETTE.sky[700],
            surfaceCard: '#FFFFFF',
            border: PALETTE.slate[300],
        },
        admin: {
            // Utilitarian/Business tool look
            background: PALETTE.slate[100],
            primary: PALETTE.sky[600],
            surfaceInput: '#E2E8F0',
        }
    },

    // --- Text Tokens ---
    textPrimary: PALETTE.slate[800],
    textSecondary: PALETTE.slate[500],
    textMuted: PALETTE.slate[400],
    textInverse: '#FFFFFF',
    textLink: PALETTE.sky[500],

    // --- Status Tokens ---
    success: PALETTE.emerald[500],
    surfaceSuccess: PALETTE.emerald[50],
    textSuccess: PALETTE.emerald[700],

    error: PALETTE.rose[500],
    surfaceError: PALETTE.rose[50],
    textError: PALETTE.rose[800],

    warning: PALETTE.amber[500],
    surfaceWarning: PALETTE.amber[50],
    textWarning: PALETTE.amber[800],

    surfaceAccent: PALETTE.violet[50],

    // --- Border & Divider ---
    borderDefault: PALETTE.slate[200],
    borderLight: PALETTE.slate[100],
    borderFocus: PALETTE.sky[500],
    borderGlass: 'rgba(255, 255, 255, 0.5)',

    // Chart & Heatmap Tokens
    chartLevel1: PALETTE.sky[100],
    chartLevel2: PALETTE.sky[300],
    chartLevel3: PALETTE.sky[500],
    chartLevel4: PALETTE.sky[700],
    chartLevel5: PALETTE.sky[900],

    // Overlay & Utility Tokens (Newly added to clear hardcoded rgba)
    overlayDark: 'rgba(0, 0, 0, 0.5)',
    overlaySubtle: 'rgba(0, 0, 0, 0.1)',
    overlayLight: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    surfaceInvisible: 'rgba(0, 0, 0, 0.01)',

    // --- Spacing System ---
    spacing: {
        xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
    },

    // --- Typography System ---
    typography: {
        headingXl: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
        headingLg: { fontSize: 28, fontWeight: '900', lineHeight: 34 },
        h1: { fontSize: 24, fontWeight: 'bold' },
        h2: { fontSize: 20, fontWeight: 'bold' },
        h3: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 16, fontWeight: 'normal' },
        bodySmall: { fontSize: 14, fontWeight: 'normal', lineHeight: 22 },
        caption: { fontSize: 14, fontWeight: 'normal', color: PALETTE.slate[500] },
        small: { fontSize: 12, fontWeight: 'normal' },
        micro: { fontSize: 10, fontWeight: '800' },
        button: { fontSize: 14, fontWeight: '600' },
    },

    // --- UI Constants ---
    radius: { sm: 4, md: 8, lg: 12, pill: 22, full: 9999 },
    shadow: {
        sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
        md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    }
};

