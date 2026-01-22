/**
 * CompanyAdapter.js
 * 
 * Adapts raw Firestore data (which might vary in structure between Admin App and Corporate App)
 * into a standardized structure for UI consumption.
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
