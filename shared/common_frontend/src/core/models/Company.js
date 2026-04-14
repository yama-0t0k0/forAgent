import { DATA_TYPE, STRINGIFIED_OBJECT } from '@shared/src/core/constants/system';

/**
 * Company Model
 * Represents a company entity in the system.
 */
export class Company {
    /**
     * @param {string} id - Company ID (e.g., B00000)
     * @param {string} name - Company Name
     * @param {string} websiteUrl - Website URL
     * @param {string} businessContent - Business Content
     * @param {string} address - Address
     * @param {string} establishmentDate - Establishment Date
     * @param {string} capital - Capital
     * @param {string} employeeCount - Employee Count
     * @param {string} averageAnnualIncome - Average Annual Income
     * @param {string} backgroundUrl - Background Image URL
     * @param {string} logoUrl - Logo Image URL
     * @param {Object.<string, any>} appeal - Appeal/Features data
     * @param {Object.<string, any>} payment - Payment information
     * @param {Object.<string, any>} connection - Connection information
     * @param {Object.<string, any>} rawData - Original Firestore data
     */
    constructor(
        id,
        name,
        websiteUrl,
        businessContent,
        address,
        establishmentDate,
        capital,
        employeeCount,
        averageAnnualIncome,
        backgroundUrl,
        logoUrl,
        appeal = {},
        payment = {},
        connection = {},
        rawData = {}
    ) {
        /** @type {string} */
        this.id = id || '';
        /** @type {string} */
        this.name = name || '';
        /** @type {string} */
        this.websiteUrl = websiteUrl || '';
        /** @type {string} */
        this.businessContent = businessContent || '';
        /** @type {string} */
        this.address = address || '';
        /** @type {string} */
        this.establishmentDate = establishmentDate || '';
        /** @type {string} */
        this.capital = capital || '';
        /** @type {string} */
        this.employeeCount = employeeCount || '';
        /** @type {string} */
        this.averageAnnualIncome = averageAnnualIncome || '';
        /** @type {string} */
        this.backgroundUrl = backgroundUrl || '';
        /** @type {string} */
        this.logoUrl = logoUrl || '';
        /** @type {Object.<string, any>} */
        this.appeal = appeal || {};
        /** @type {Object.<string, any>} */
        this.payment = payment || {};
        /** @type {Object.<string, any>} */
        this.connection = connection || {};
        /** @type {Object.<string, any>} */
        this.rawData = rawData || {};
    }

    /**
     * Field names mapped to Firestore keys.
     * @readonly
     * @enum {string}
     */
    static FIELDS = {
        PROFILE: '会社概要',
        APPEAL: '魅力/特徴',
        APPEAL_OTHER: 'エンジニアにとってのその他の魅力',
        PAYMENT: '決済',
        CONNECTION: '繋がり',
        NAME: '社名',
        WEBSITE_URL: 'WEBサイトURL',
        BUSINESS_CONTENT: '事業内容',
        ADDRESS: '所在地',
        ADDRESS_ALT1: '住所',
        ADDRESS_ALT2: '本社所在地',
        ESTABLISHMENT_DATE: '設立年月日',
        CAPITAL: '資本金',
        EMPLOYEE_COUNT: '正社員数',
        AVERAGE_ANNUAL_INCOME: '平均年収',
        BACKGROUND_URL: '背景画像URL',
        LOGO_URL: 'ロゴ画像URL'
    };

    /** @type {string} */
    static TEMPLATE_NAME = 'ヤヲー株式会社';

    /**
     * Creates a Company instance from Firestore data.
     * @param {string} id - Document ID
     * @param {Object.<string, any>} data - Firestore document data
     * @returns {Company}
     */
    static fromFirestore(id, data) {
        if (!data) return new Company(id, '', '', '', '', '', '', '', '', '', '', {}, {}, {}, {});

        // If data is already a Company instance, return it directly
        if (data instanceof Company) {
            return data;
        }

        /** @type {Object.<string, any>} */
        const profile = data[Company.FIELDS.PROFILE] ?? {};
        /** @type {Object.<string, any>} */
        const appeal = data[Company.FIELDS.APPEAL] ?? data.appeal ?? {};
        /** @type {Object.<string, any>} */
        const payment = data[Company.FIELDS.PAYMENT] ?? data.payment ?? {};
        /** @type {Object.<string, any>} */
        const connection = data[Company.FIELDS.CONNECTION] ?? data.connection ?? {};
        
        // Fix: Admin data often has flat 'companyName' but carries 'ヤヲー株式会社' in nested profile from template.
        // We should prioritize the flat real name if the nested name is the template placeholder.
        let name = profile[Company.FIELDS.NAME];
        const flatName = data.companyName || data.name;
        if (name === Company.TEMPLATE_NAME && flatName) {
            name = flatName;
        }

        const BACKTICK = '`';
        const MIN_WRAPPED_LENGTH = 2;

        /**
         * @param {unknown} value
         * @returns {string}
         */
        const normalizeUrl = (value) => {
            if (typeof value !== DATA_TYPE.STRING) {
                return '';
            }

            const trimmed = value.trim();
            if (trimmed.startsWith(BACKTICK) && trimmed.endsWith(BACKTICK) && trimmed.length >= MIN_WRAPPED_LENGTH) {
                return trimmed.slice(1, -1).trim();
            }

            return trimmed;
        };

        return new Company(
            id,
            String(name ?? flatName ?? ''),
            String(profile[Company.FIELDS.WEBSITE_URL] ?? data.websiteUrl ?? ''),
            String(profile[Company.FIELDS.BUSINESS_CONTENT] ?? data.businessContent ?? data.description ?? ''),
            String(profile[Company.FIELDS.ADDRESS] ?? profile[Company.FIELDS.ADDRESS_ALT1] ?? profile[Company.FIELDS.ADDRESS_ALT2] ?? data.address ?? ''),
            String(profile[Company.FIELDS.ESTABLISHMENT_DATE] ?? data.establishmentDate ?? ''),
            String(profile[Company.FIELDS.CAPITAL] ?? data.capital ?? ''),
            String(profile[Company.FIELDS.EMPLOYEE_COUNT] ?? data.employeeCount ?? ''),
            String(profile[Company.FIELDS.AVERAGE_ANNUAL_INCOME] ?? data.averageAnnualIncome ?? ''),
            normalizeUrl(profile[Company.FIELDS.BACKGROUND_URL] ?? data.backgroundUrl ?? ''),
            normalizeUrl(profile[Company.FIELDS.LOGO_URL] ?? data.logoUrl ?? ''),
            appeal,
            payment,
            connection,
            data
        );
    }

    /**
     * Returns the formatted address.
     * @returns {string}
     */
    get formattedAddress() {
        const addr = this.address;
        if (!addr) return '-';
        
        // If it's a string, return as is
        if (typeof addr === DATA_TYPE.STRING && !addr.startsWith('[object')) return addr;

        // If it's an object (from rawData or parsed), try to format it
        // Note: this.address is typed as string in constructor, but raw data might have put an object there 
        // if not careful. However, constructor forces String(). 
        // If the original data had an object for '所在地', String(obj) would be "[object Object]".
        // So we need to look at rawData if this.address looks like an object stringified or if we want to be safe.
        
        const rawProfile = this.rawData['会社概要'] || {};
        const rawAddr = rawProfile['所在地'] || rawProfile['住所'] || rawProfile['本社所在地'] || this.rawData.address;

        if (typeof rawAddr === DATA_TYPE.OBJECT && rawAddr !== null) {
            const parts = [
                rawAddr['郵便番号(ハイフンなし)'] ? `〒${rawAddr['郵便番号(ハイフンなし)']}` : null,
                rawAddr['都道府県'],
                rawAddr['市区町村'],
                rawAddr['町名_番地'],
                rawAddr['建物名_部屋番号等'],
            ].filter(Boolean);
            const joined = parts.join(' ');
            return joined || '-';
        }
        
        return this.address !== STRINGIFIED_OBJECT ? this.address : '-';
    }
}
