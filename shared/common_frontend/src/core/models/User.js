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
     * @param {Object.<string, any>} skillsExperience - Skills and Experience data
     * @param {Object.<string, any>} aspirations - Aspirations/Goals data
     * @param {Object.<string, any>} rawData - Original Firestore data (kept for compatibility/heatmap calculation)
     */
    constructor(id, firstNameEn, familyNameEn, firstNameKanji, familyNameKanji, email, profileImageUrl, backgroundImageUrl, skillsExperience = {}, aspirations = {}, rawData = {}) {
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
        this.skillsExperience = skillsExperience || {};
        /** @type {Object.<string, any>} */
        this.aspirations = aspirations || {};
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
        if (!data) return new User(id, "", "", "", "", "", "", "", {}, {}, {});

        /** @type {Object.<string, any>} */
        const basicInfo = data.basicInfo ?? data['基本情報'] ?? {};
        const firstNameEn = basicInfo['First name(半角英)'] || "";
        const familyNameEn = basicInfo['Family name(半角英)'] || "";
        const firstNameKanji = basicInfo['名'] || "";
        const familyNameKanji = basicInfo['姓'] || "";
        const email = basicInfo['メール'] || "";
        const profileImageUrl = basicInfo['プロフィール画像URL'] || "";
        const backgroundImageUrl = basicInfo['背景画像URL'] || "";
        /** @type {Object.<string, any>} */
        const skillsExperience = data.skillsExperience ?? data['スキル経験'] ?? {};
        /** @type {Object.<string, any>} */
        const aspirations = data.aspirations ?? data['志向'] ?? {};

        return new User(
            id,
            String(firstNameEn),
            String(familyNameEn),
            String(firstNameKanji),
            String(familyNameKanji),
            String(email),
            String(profileImageUrl),
            String(backgroundImageUrl),
            skillsExperience,
            aspirations,
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
