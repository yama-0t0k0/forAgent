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
        this.id = id || "";
        /** @type {string} */
        this.name = name || "";
        /** @type {string} */
        this.websiteUrl = websiteUrl || "";
        /** @type {string} */
        this.businessContent = businessContent || "";
        /** @type {string} */
        this.address = address || "";
        /** @type {string} */
        this.establishmentDate = establishmentDate || "";
        /** @type {string} */
        this.capital = capital || "";
        /** @type {string} */
        this.employeeCount = employeeCount || "";
        /** @type {string} */
        this.averageAnnualIncome = averageAnnualIncome || "";
        /** @type {string} */
        this.backgroundUrl = backgroundUrl || "";
        /** @type {string} */
        this.logoUrl = logoUrl || "";
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
     * Creates a Company instance from Firestore data.
     * @param {string} id - Document ID
     * @param {Object.<string, any>} data - Firestore document data
     * @returns {Company}
     */
    static fromFirestore(id, data) {
        if (!data) return new Company(id, "", "", "", "", "", "", "", "", "", "", {}, {}, {}, {});

        /** @type {Object.<string, any>} */
        const profile = data['会社概要'] ?? {};
        /** @type {Object.<string, any>} */
        const appeal = data['魅力/特徴'] ?? data.appeal ?? {};
        /** @type {Object.<string, any>} */
        const payment = data['決済'] ?? data.payment ?? {};
        /** @type {Object.<string, any>} */
        const connection = data['繋がり'] ?? data.connection ?? {};
        
        return new Company(
            id,
            String(profile['社名'] ?? data.companyName ?? data.name ?? ""),
            String(profile['WEBサイトURL'] ?? data.websiteUrl ?? ""),
            String(profile['事業内容'] ?? data.businessContent ?? ""),
            String(profile['所在地'] ?? profile['住所'] ?? profile['本社所在地'] ?? data.address ?? ""),
            String(profile['設立年月日'] ?? data.establishmentDate ?? ""),
            String(profile['資本金'] ?? data.capital ?? ""),
            String(profile['正社員数'] ?? data.employeeCount ?? ""),
            String(profile['平均年収'] ?? data.averageAnnualIncome ?? ""),
            String(profile['背景画像URL'] ?? data.backgroundUrl ?? ""),
            String(profile['ロゴ画像URL'] ?? data.logoUrl ?? ""),
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
        if (typeof addr === 'string' && !addr.startsWith('[object')) return addr;

        // If it's an object (from rawData or parsed), try to format it
        // Note: this.address is typed as string in constructor, but raw data might have put an object there 
        // if not careful. However, constructor forces String(). 
        // If the original data had an object for '所在地', String(obj) would be "[object Object]".
        // So we need to look at rawData if this.address looks like an object stringified or if we want to be safe.
        
        const rawProfile = this.rawData['会社概要'] || {};
        const rawAddr = rawProfile['所在地'] || rawProfile['住所'] || rawProfile['本社所在地'] || this.rawData.address;

        if (typeof rawAddr === 'object' && rawAddr !== null) {
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
        
        return this.address !== "[object Object]" ? this.address : '-';
    }
}
