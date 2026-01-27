import { Company } from '../models/Company';

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
    // 1. Convert to Model
    const company = Company.fromFirestore(data.id || '', data);

    // 2. Extract nested sections (legacy support or raw access)
    // Note: features is mapped to company.appeal
    /** @type {Object.<string, any>} */
    const rawCompanyInfo = data['会社概要'] ?? {};
    /** @type {Object.<string, any>} */
    const rawTechStack = data['技術スタック'] ?? data['使用技術'] ?? {};

    // 3. Resolve flat vs nested fields using Company model logic
    const companyName = company.name || '会社名未設定';
    const businessContent = company.businessContent || '事業内容が設定されていません。';
    const backgroundUrl = company.backgroundUrl || null;
    const logoUrl = company.logoUrl || null;

    return {
        // Raw sections (for components that need them directly)
        raw: {
            companyInfo: rawCompanyInfo,
            features: company.appeal,
            techStack: rawTechStack
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
