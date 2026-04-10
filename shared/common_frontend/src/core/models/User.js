const TYPE_OBJECT = 'object';

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
     * @param {Object.<string, any>} rawData - Original Firestore data
     * @param {boolean} [canCreateCompany=false] - Permission to create a company
     */
    constructor(id, firstNameEn, familyNameEn, firstNameKanji, familyNameKanji, email, profileImageUrl, backgroundImageUrl, skillsExperience = {}, aspirations = {}, rawData = {}, canCreateCompany = false) {
        /** @type {string} */
        this.id = id || '';
        /** @type {string} */
        this.uid = id || ''; // Alias for compatibility
        /** @type {string} */
        this.firstNameEn = firstNameEn || '';
        /** @type {string} */
        this.familyNameEn = familyNameEn || '';
        /** @type {string} */
        this.firstNameKanji = firstNameKanji || '';
        /** @type {string} */
        this.familyNameKanji = familyNameKanji || '';
        /** @type {string} */
        this.email = email || '';
        /** @type {string} */
        this.profileImageUrl = profileImageUrl || '';
        /** @type {string} */
        this.backgroundImageUrl = backgroundImageUrl || '';
        /** @type {Object.<string, any>} */
        this.skillsExperience = skillsExperience || {};
        /** @type {Object.<string, any>} */
        this.aspirations = aspirations || {};
        /** @type {Object.<string, any>} */
        this.rawData = rawData || {};
        /** @type {string} */
        this.role = this.rawData.role || 'individual';
        /** @type {string[]} */
        this.allowedCompanies = this.rawData.allowed_companies || [];
        /** @type {boolean} */
        this.canCreateCompany = canCreateCompany || !!this.rawData.canCreateCompany;
    }

    /**
     * Checks if the user is a corporate member (has any corporate role or is linked to a company).
     * @returns {boolean}
     */
    isCorporateMember() {
        return this.role.startsWith('corporate') || this.allowedCompanies.length > 0;
    }

    /**
     * Field names mapped to Firestore keys.
     * @readonly
     * @enum {string}
     */
    static FIELDS = {
        BASIC_INFO: '基本情報',
        FIRST_NAME_EN: 'First name(半角英)',
        FAMILY_NAME_EN: 'Family name(半角英)',
        FIRST_NAME_KANJI: '名',
        FAMILY_NAME_KANJI: '姓',
        EMAIL: 'メール',
        PROFILE_IMAGE_URL: 'プロフィール画像URL',
        BACKGROUND_IMAGE_URL: '背景画像URL',
        SKILLS_EXPERIENCE: 'スキル経験',
        ASPIRATIONS: '志向'
    };

    /**
     * Creates a User instance from Firestore data.
     * @param {string} id - Document ID
     * @param {Object.<string, any>} data - Firestore document data
     * @returns {User}
     */
    static fromFirestore(id, data) {
        if (!data) return new User(id, '', '', '', '', '', '', '', {}, {}, {});

        // If data is already a User instance, return it directly
        if (data instanceof User) {
            return data;
        }

        /** @type {Object.<string, any>} */
        const basicInfo = data.basicInfo ?? data[User.FIELDS.BASIC_INFO] ?? {};
        // Add fallback to top-level properties for flattened JSON (e.g. from API response)
        const firstNameEn = basicInfo[User.FIELDS.FIRST_NAME_EN] || data.firstNameEn || '';
        const familyNameEn = basicInfo[User.FIELDS.FAMILY_NAME_EN] || data.familyNameEn || '';
        let firstNameKanji = basicInfo[User.FIELDS.FIRST_NAME_KANJI] || data.firstNameKanji || '';
        let familyNameKanji = basicInfo[User.FIELDS.FAMILY_NAME_KANJI] || data.familyNameKanji || '';
        
        // Fallback: If kanji names are empty but 'name' exists (e.g. from public_profile), use it
        if (!firstNameKanji && !familyNameKanji) {
            // Check root data
            if (data.name) firstNameKanji = data.name;
            else if (data.fullName) firstNameKanji = data.fullName;
            else if (data.displayName) firstNameKanji = data.displayName;
            // Check basicInfo (in case it's nested there)
            else if (basicInfo.name) firstNameKanji = basicInfo.name;
            else if (basicInfo.fullName) firstNameKanji = basicInfo.fullName;
            else if (basicInfo.displayName) firstNameKanji = basicInfo.displayName;
        }

        const email = basicInfo[User.FIELDS.EMAIL] || data.email || '';
        const profileImageUrl = basicInfo[User.FIELDS.PROFILE_IMAGE_URL] || data.profileImageUrl || '';
        const backgroundImageUrl = basicInfo[User.FIELDS.BACKGROUND_IMAGE_URL] || data.backgroundImageUrl || '';
        /** @type {Object.<string, any>} */
        const skillsExperience = data.skillsExperience ?? data[User.FIELDS.SKILLS_EXPERIENCE] ?? {};
        /** @type {Object.<string, any>} */
        const aspirations = data.aspirations ?? data[User.FIELDS.ASPIRATIONS] ?? {};

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
     * Creates a User instance from separated public/private data.
     * @param {string} id - Document ID
     * @param {Object.<string, any>} publicData - Data from public_profile
     * @param {Object.<string, any>} privateData - Data from private_info (can be null)
     * @returns {User}
     */
    static fromPublicPrivate(id, publicData, privateData) {
        const mergedData = { ...(publicData || {}) };

        // Merge private data if available
        if (privateData) {
            // Merge '基本情報' (Basic Info) which contains PII
            if (privateData[User.FIELDS.BASIC_INFO]) {
                mergedData[User.FIELDS.BASIC_INFO] = {
                    ...(mergedData[User.FIELDS.BASIC_INFO] || {}),
                    ...privateData[User.FIELDS.BASIC_INFO]
                };
            }

            // Merge other top-level fields
            Object.keys(privateData).forEach(key => {
                if (key !== User.FIELDS.BASIC_INFO) {
                    mergedData[key] = privateData[key];
                }
            });
        }

        return User.fromFirestore(id, mergedData);
    }

    /**
     * Splits user data into public and private parts.
     * @param {Object} data - The full user data object.
     * @returns {{publicData: Object, privateData: Object}}
     */
    static splitData(data) {
        // Deep clone to avoid mutating original data
        const publicData = JSON.parse(JSON.stringify(data));
        const privateData = {};
        
        // PII Keys to move to private_info
        // Based on migration logic
        const piiKeys = [
            '姓', '名', 'Family name(半角英)', 'First name(半角英)', 
            'メール', 'TEL', '住所', '生年月日',
            'Googleアカウント', 'GitHubアカウント', 'ハンドルネーム', 'パスワード'
        ];

        const basicInfo = publicData[User.FIELDS.BASIC_INFO];

        if (basicInfo && typeof basicInfo === TYPE_OBJECT) {
            privateData[User.FIELDS.BASIC_INFO] = {};
            
            piiKeys.forEach(key => {
                if (basicInfo[key] !== undefined) {
                    privateData[User.FIELDS.BASIC_INFO][key] = basicInfo[key];
                    // Remove from publicData
                    delete basicInfo[key];
                }
            });

            // Clean up empty object if needed, but keeping '基本情報' key is fine
        }

        // Also handle top-level PII fields if they exist (User.js fields)
        const topLevelPii = [
            'email', 'firstNameEn', 'familyNameEn', 'firstNameKanji', 'familyNameKanji'
        ];
        
        topLevelPii.forEach(key => {
            if (publicData[key] !== undefined) {
                privateData[key] = publicData[key];
                delete publicData[key];
            }
        });

        // Handle allowed_companies (Must be in private_info for Security Rules)
        if (publicData['allowed_companies'] !== undefined) {
            privateData['allowed_companies'] = publicData['allowed_companies'];
            delete publicData['allowed_companies'];
        }

        return { publicData, privateData };
    }

    /**
     * Returns the full name in Kanji.
     * @returns {string}
     */
    get fullNameKanji() {
        return `${this.familyNameKanji} ${this.firstNameKanji}`.trim();
    }
}
