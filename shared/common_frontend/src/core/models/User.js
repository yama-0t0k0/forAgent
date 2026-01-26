/**
 * User Model
 * Represents an individual user in the system.
 */
export class User {
    /**
     * @param {string} id - User ID
     * @param {string} firstNameEn - First name (English)
     * @param {string} familyNameEn - Family name (English)
     * @param {string} firstNameKanji - First name (Kanji)
     * @param {string} familyNameKanji - Family name (Kanji)
     * @param {string} email - Email address
     * @param {string} profileImageUrl - Profile Image URL
     * @param {string} backgroundImageUrl - Background Image URL
     * @param {Object.<string, any>} rawData - Original Firestore data (kept for compatibility/heatmap calculation)
     */
    constructor(id, firstNameEn, familyNameEn, firstNameKanji, familyNameKanji, email, profileImageUrl, backgroundImageUrl, rawData = {}) {
        /** @type {string} */
        this.id = id || "";
        /** @type {string} */
        this.firstNameEn = firstNameEn || "";
        /** @type {string} */
        this.familyNameEn = familyNameEn || "";
        /** @type {string} */
        this.firstNameKanji = firstNameKanji || "";
        /** @type {string} */
        this.familyNameKanji = familyNameKanji || "";
        /** @type {string} */
        this.email = email || "";
        /** @type {string} */
        this.profileImageUrl = profileImageUrl || "";
        /** @type {string} */
        this.backgroundImageUrl = backgroundImageUrl || "";
        /** @type {Object.<string, any>} */
        this.rawData = rawData || {};
    }

    /**
     * Creates a User instance from Firestore data.
     * @param {string} id - Document ID
     * @param {Object.<string, any>} data - Firestore document data
     * @returns {User}
     */
    static fromFirestore(id, data) {
        if (!data) return new User(id, "", "", "", "", "", "", "", {});

        const basicInfo = data['基本情報'] || {};
        return new User(
            id,
            String(basicInfo['First name(半角英)'] || ""),
            String(basicInfo['Family name(半角英)'] || ""),
            String(basicInfo['名'] || ""),
            String(basicInfo['姓'] || ""),
            String(basicInfo['メール'] || ""),
            String(basicInfo['プロフィール画像URL'] || ""),
            String(basicInfo['背景画像URL'] || ""),
            data
        );
    }

    /**
     * Returns the full name in Kanji.
     * @returns {string}
     */
    get fullNameKanji() {
        return `${this.familyNameKanji} ${this.firstNameKanji}`.trim();
    }
}
