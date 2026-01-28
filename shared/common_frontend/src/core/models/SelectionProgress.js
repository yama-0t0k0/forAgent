/**
 * Model representing a Selection Progress (FeeMgmtAndJobStatDB) document.
 * Follows the Coding Conventions for JavaScript.
 */
export class SelectionProgress {
    /**
     * Firestore field keys mapping.
     * Centralizes key strings to avoid hardcoding in components.
     */
    static FIELDS = {
        PROGRESS: '選考進捗',
        PHASE: 'fase_フェイズ',
        STATUS: 'status_ステータス',
        INDIVIDUAL_ID: 'id_individual_個人ID',
        COMPANY_ID: 'id_company_法人ID',
        JD_NUMBER: 'JD_Number',
        UPDATE_TIMESTAMP: 'UpdateTimestamp_yyyymmddtttttt',
        JOB_STAT_ID: 'JobStatID',
        FEE: '紹介料管理',
        SURVEY: 'アンケート',
        DOCUMENT_SCREENING: 'document_screening_書類選考',
        FIRST_INTERVIEW: '1st_interview_1次面接',
        SECOND_INTERVIEW: '2nd_interview_2次面接',
        FINAL_INTERVIEW: 'final_interview_最終面接'
    };

    /**
     * Factory method to create an instance from Firestore data.
     * @param {string} id - The document ID.
     * @param {Object} data - The document data.
     * @returns {SelectionProgress} A new SelectionProgress instance.
     */
    static fromFirestore(id, data) {
        if (!data) return new SelectionProgress(id, {}, {}, {}, {});

        const progress = data[SelectionProgress.FIELDS.PROGRESS] || {};
        const fee = data[SelectionProgress.FIELDS.FEE] || {};
        const survey = data[SelectionProgress.FIELDS.SURVEY] || {};
        
        return new SelectionProgress(id, progress, fee, survey, data);
    }

    /**
     * @param {string} id 
     * @param {Object} progress 
     * @param {Object} fee
     * @param {Object} survey
     * @param {Object} rawData 
     */
    constructor(id, progress, fee, survey, rawData) {
        this.id = id;
        this.progress = progress;
        this.fee = fee;
        this.survey = survey;
        this.rawData = rawData;
    }

    /**
     * Gets the estimated annual salary.
     * @returns {number}
     */
    get estimatedAnnualSalary() {
        return this.fee['estimated_annual_salary_想定年収'];
    }

    /**
     * Gets the fee rate.
     * @returns {number}
     */
    get feeRate() {
        return this.fee['fee_rate_料率'];
    }

    /**
     * Gets the billing amount.
     * @returns {number}
     */
    get billingAmount() {
        return this.fee['billing_amount_請求金額'];
    }

    /**
     * Gets the payment date.
     * @returns {string}
     */
    get paymentDate() {
        return this.fee['payment_date_入金日'];
    }

    /**
     * Gets the refund policy.
     * @returns {string}
     */
    get refundPolicy() {
        return this.fee['refund_policy_返金規定'];
    }

    get documentScreening() { return this.progress[SelectionProgress.FIELDS.DOCUMENT_SCREENING]; }
    get firstInterview() { return this.progress[SelectionProgress.FIELDS.FIRST_INTERVIEW]; }
    get secondInterview() { return this.progress[SelectionProgress.FIELDS.SECOND_INTERVIEW]; }
    get finalInterview() { return this.progress[SelectionProgress.FIELDS.FINAL_INTERVIEW]; }

    /**
     * Gets the active phase key.
     * @returns {string} The active phase key or '-'.
     */
    get activePhase() {
        const phases = this.progress[SelectionProgress.FIELDS.PHASE] || {};
        return this._getActiveKey(phases);
    }

    /**
     * Gets the active status key.
     * @returns {string} The active status key or '-'.
     */
    get activeStatus() {
        const statuses = this.progress[SelectionProgress.FIELDS.STATUS] || {};
        return this._getActiveKey(statuses);
    }

    /**
     * Gets the Individual ID.
     * @returns {string}
     */
    get individualId() {
        return this.progress[SelectionProgress.FIELDS.INDIVIDUAL_ID] || '-';
    }

    /**
     * Gets the Company ID.
     * @returns {string}
     */
    get companyId() {
        return this.progress[SelectionProgress.FIELDS.COMPANY_ID] || '-';
    }

    /**
     * Gets the JD Number.
     * @returns {string}
     */
    get jdNumber() {
        return this.progress[SelectionProgress.FIELDS.JD_NUMBER] || '-';
    }

    /**
     * Gets the update timestamp.
     * @returns {string}
     */
    get updateTime() {
        return this.rawData[SelectionProgress.FIELDS.UPDATE_TIMESTAMP] || '-';
    }

    /**
     * Helper to find the key with true value.
     * @param {Object} obj 
     * @returns {string}
     * @private
     */
    _getActiveKey(obj) {
        if (!obj) return '-';
        const entry = Object.entries(obj).find(([_, value]) => value === true);
        return entry ? entry[0] : '-';
    }
}
