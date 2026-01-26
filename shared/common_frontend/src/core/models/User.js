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
     * @param {Object} rawData - Original Firestore data (kept for compatibility/heatmap calculation)
     */
    constructor(id, firstNameEn, familyNameEn, firstNameKanji, familyNameKanji, email, profileImageUrl, backgroundImageUrl, rawData = {}) {
        this.id = id || "";
        this.firstNameEn = firstNameEn || "";
        this.familyNameEn = familyNameEn || "";
        this.firstNameKanji = firstNameKanji || "";
        this.familyNameKanji = familyNameKanji || "";
        this.email = email || "";
        this.profileImageUrl = profileImageUrl || "";
        this.backgroundImageUrl = backgroundImageUrl || "";
        this.rawData = rawData || {};
    }

    /**
     * Creates a User instance from Firestore data.
     * @param {string} id - Document ID
     * @param {Object} data - Firestore document data
     * @returns {User}
     */
    static fromFirestore(id, data) {
        if (!data) return new User(id, "", "", "", "", "", "", "", {});

        const basicInfo = data['基本情報'] || {};
        return new User(
            id,
            basicInfo['First name(半角英)'] || "",
            basicInfo['Family name(半角英)'] || "",
            basicInfo['名'] || "",
            basicInfo['姓'] || "",
            basicInfo['メール'] || "",
            basicInfo['プロフィール画像URL'] || "",
            basicInfo['背景画像URL'] || "",
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
