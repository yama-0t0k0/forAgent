/**
 * JobDescription Model
 * Represents a job description (JD) entity in the system.
 */
export class JobDescription {
    /**
     * @param {string} id - JD Number / Document ID
     * @param {string} companyId - Company ID this JD belongs to
     * @param {string} positionName - Position Name (e.g., "Frontend Engineer")
     * @param {Object.<string, any>} basicItems - Basic items (求人基本項目)
     * @param {Object.<string, any>} skillsExperience - Skills requirements (mapped to 'スキル経験' for compatibility)
     * @param {Object.<string, any>} rawData - Original Firestore data
     */
    constructor(id, companyId, positionName, basicItems = {}, skillsExperience = {}, rawData = {}) {
        /** @type {string} */
        this.id = id || "";
        /** @type {string} */
        this.companyId = companyId || "";
        /** @type {string} */
        this.positionName = positionName || "";
        /** @type {Object.<string, any>} */
        this.basicItems = basicItems || {};
        /** @type {Object.<string, any>} */
        this.skillsExperience = skillsExperience || {};
        /** @type {Object.<string, any>} */
        this.rawData = rawData || {};
    }

    /**
     * Field names mapped to Firestore keys.
     * @readonly
     * @enum {string}
     */
    static FIELDS = {
        BASIC_ITEMS: '求人基本項目',
        JD_NUMBER: 'JD_Number',
        POSITION_NAME: 'ポジション名',
        SKILL_REQUIREMENTS: 'スキル要件',
        SKILLS_EXPERIENCE: 'スキル経験' // For compatibility with User model
    };

    /**
     * Creates a JobDescription instance from Firestore data.
     * @param {string} id - Document ID (JD_Number)
     * @param {Object.<string, any>} data - Firestore document data
     * @param {string} [companyId=""] - Optional Company ID context
     * @returns {JobDescription}
     */
    static fromFirestore(id, data, companyId = "") {
        if (!data) return new JobDescription(id, companyId, "", {}, {}, {});

        if (data instanceof JobDescription) {
            return data;
        }

        /** @type {Object.<string, any>} */
        const basicItems = data.basicItems ?? data[JobDescription.FIELDS.BASIC_ITEMS] ?? {};
        // Add fallback to top-level properties for flattened JSON (e.g. from API response)
        const jdNumber = id || data.JD_Number || basicItems.JD_Number || "";
        const positionName = basicItems[JobDescription.FIELDS.POSITION_NAME] || data.title || data.positionName || "";
        
        // Map 'スキル要件' to 'skillsExperience' to unify interface with User model
        // This allows HeatmapCalculator to work with both User and JobDescription seamlessly
        const skillsExperience = data.skillsExperience ?? data[JobDescription.FIELDS.SKILLS_EXPERIENCE] ?? data[JobDescription.FIELDS.SKILL_REQUIREMENTS] ?? {};
        
        return new JobDescription(
            jdNumber,
            companyId,
            String(positionName),
            basicItems,
            skillsExperience,
            data
        );
    }
}
