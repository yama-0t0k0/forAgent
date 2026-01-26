/**
 * CompanyAdapter.js
 * 
 * Adapts raw Firestore data (which might vary in structure between Admin App and Corporate App)
 * into a standardized structure for UI consumption.
 */

/**
 * 会社データをUI表示用にアダプトします。
 * Adminアプリのフラットな構造とCorporateアプリのネストされた構造の両方に対応します。
 * 
 * @param {Object} data Firestoreからの生の会社データ
 * @returns {Object} UIコンポーネントで利用可能な標準化された会社データオブジェクト
 * @property {Object} raw 元のデータセクション（会社概要、魅力/特徴、技術スタック）
 * @property {string} companyName 会社名
 * @property {string} businessContent 事業内容
 * @property {string|null} backgroundUrl 背景画像URL
 * @property {string|null} logoUrl ロゴ画像URL
 * @property {string[]} _debugKeys デバッグ用のキーリスト
 */
export const adaptCompanyData = (data = {}) => {
    // 1. Extract nested sections
    const companyInfo = data['会社概要'] || {};
    const features = data['魅力/特徴'] || {};
    const techStack = data['技術スタック'] || data['使用技術'] || {};

    // 2. Resolve flat vs nested fields with fallbacks
    // Compatibility for admin_app flat data or legacy data
    const companyName = companyInfo['社名'] || data['name'] || data['companyName'] || '会社名未設定';

    const businessContent = companyInfo['事業内容'] || data['description'] || data['businessContent'] || '事業内容が設定されていません。';

    const backgroundUrl = companyInfo['背景画像URL'] || data['backgroundUrl'] || null;
    const logoUrl = companyInfo['ロゴ画像URL'] || data['logoUrl'] || null;

    return {
        // Raw sections (for components that need them directly)
        raw: {
            companyInfo,
            features,
            techStack
        },
        // Standardized flat fields
        companyName,
        businessContent,
        backgroundUrl,
        logoUrl,
        // Helper to debug data issues
        _debugKeys: Object.keys(data)
    };
};
