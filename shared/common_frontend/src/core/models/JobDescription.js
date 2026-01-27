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
     * @param {Object.<string, any>} rawData - Original Firestore data
     */
    constructor(id, companyId, positionName, basicItems = {}, rawData = {}) {
        /** @type {string} */
        this.id = id || "";
        /** @type {string} */
        this.companyId = companyId || "";
        /** @type {string} */
        this.positionName = positionName || "";
        /** @type {Object.<string, any>} */
        this.basicItems = basicItems || {};
        /** @type {Object.<string, any>} */
        this.rawData = rawData || {};
    }

    /**
     * Creates a JobDescription instance from Firestore data.
     * @param {string} id - Document ID (JD_Number)
     * @param {Object.<string, any>} data - Firestore document data
     * @param {string} [companyId=""] - Optional Company ID context
     * @returns {JobDescription}
     */
    static fromFirestore(id, data, companyId = "") {
        if (!data) return new JobDescription(id, companyId, "", {}, {});

        /** @type {Object.<string, any>} */
        const basicItems = data.basicItems ?? data['求人基本項目'] ?? {};
        const jdNumber = id || data.JD_Number || basicItems.JD_Number || "";
        const positionName = basicItems['ポジション名'] || data.title || data.positionName || "";
        
        return new JobDescription(
            jdNumber,
            companyId,
            String(positionName),
            basicItems,
            data
        );
    }
}
