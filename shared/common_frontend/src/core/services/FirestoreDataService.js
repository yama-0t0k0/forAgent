/**
 * Firestore Data Service
 * 共通データ取得ロジックを提供するサービス
 */

import { db } from '../firebaseConfig';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

/**
 * Merges arrays of objects by ID, removing duplicates.
 * @param {Array<Array<Object>>} arrays - Array of object arrays to merge.
 * @returns {Array<Object>} Merged array of unique objects.
 */
const mergeById = (arrays) => {
    const map = new Map();
    arrays.flat().forEach((item) => {
        if (!item?.id) return;
        if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
};

/**
 * Fetches documents from a Firestore collection.
 * @param {string} collectionName - The name of the collection.
 * @returns {Promise<Array<Object>>} List of documents with IDs.
 */
const fetchCollection = async (collectionName) => {
    try {
        const snap = await getDocs(collection(db, collectionName));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error(`[FirestoreDataService] Error fetching ${collectionName}:`, e);
        return [];
    }
};

/**
 * Fetches a single document from Firestore.
 * @param {string} collectionName - The collection name.
 * @param {string} docId - The document ID.
 * @returns {Promise<Object|null>} The document data or null.
 */
const fetchDocument = async (collectionName, docId) => {
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (e) {
        console.error(`[FirestoreDataService] Error fetching ${collectionName}/${docId}:`, e);
        return null;
    }
};

export const FirestoreDataService = {
    /**
     * Fetches all individuals from the 'individual' collection.
     * @returns {Promise<Array<Object>>}
     */
    async fetchAllIndividuals() {
        return fetchCollection('individual');
    },

    /**
     * Fetches a single individual by ID.
     * @param {string} id - The individual ID.
     * @returns {Promise<Object|null>}
     */
    async fetchIndividualById(id) {
        return fetchDocument('individual', id);
    },

    /**
     * Fetches all job descriptions with nested JD_Number subcollections.
     * @returns {Promise<Array<Object>>}
     */
    async fetchAllJobDescriptions() {
        try {
            const companiesSnap = await getDocs(collection(db, 'job_description'));
            const allJobs = [];

            const promises = companiesSnap.docs.map(async (companyDoc) => {
                const companyId = companyDoc.id;
                try {
                    const jdSnap = await getDocs(collection(db, 'job_description', companyId, 'JD_Number'));
                    jdSnap.forEach(d => {
                        const data = d.data();
                        allJobs.push({
                            id: `${companyId}_${d.id}`,
                            company_ID: companyId,
                            JD_Number: data.JD_Number || d.id,
                            ...data
                        });
                    });
                } catch (err) {
                    console.error(`[FirestoreDataService] Error fetching JDs for ${companyId}:`, err);
                }
            });

            await Promise.all(promises);
            return allJobs;
        } catch (e) {
            console.error('[FirestoreDataService] Error fetching job descriptions:', e);
            return [];
        }
    },

    /**
     * Fetches all corporates from multiple possible collection names.
     * @returns {Promise<Array<Object>>}
     */
    async fetchAllCorporates() {
        const [companiesPrimary, companiesFallback1, companiesFallback2] = await Promise.all([
            fetchCollection('Company'),
            fetchCollection('company'),
            fetchCollection('corporate')
        ]);
        return mergeById([companiesPrimary, companiesFallback1, companiesFallback2]);
    },

    /**
     * Fetches a single corporate by ID.
     * @param {string} id - The corporate ID.
     * @param {string} [collectionName='company'] - The collection name.
     * @returns {Promise<Object|null>}
     */
    async fetchCorporateById(id, collectionName = 'company') {
        return fetchDocument(collectionName, id);
    },

    /**
     * Fetches all Fee Management & Job Stats data.
     * @returns {Promise<Array<Object>>}
     */
    async fetchAllFMJS() {
        return fetchCollection('FeeMgmtAndJobStatDB');
    },

    /**
     * Fetches all data needed for admin app.
     * @returns {Promise<{users: Array, corporate: Array, jd: Array, fmjs: Array}>}
     */
    async fetchAdminData() {
        const [users, corporate, jd, fmjs] = await Promise.all([
            this.fetchAllIndividuals(),
            this.fetchAllCorporates(),
            this.fetchAllJobDescriptions(),
            this.fetchAllFMJS()
        ]);
        return { users, corporate, jd, fmjs };
    },

    /**
     * Fetches all data needed for individual user app.
     * @param {string} currentUserId - The current user's ID.
     * @param {Object} fallbackTemplate - Fallback template if user not found.
     * @returns {Promise<{userData: Object, jd: Array, users: Array}>}
     */
    async fetchIndividualAppData(currentUserId, fallbackTemplate = {}) {
        const [currentUser, jd, allUsers] = await Promise.all([
            this.fetchIndividualById(currentUserId),
            this.fetchAllJobDescriptions(),
            this.fetchAllIndividuals()
        ]);

        const userData = currentUser || fallbackTemplate;
        const users = allUsers.filter(u => u.id !== currentUserId);

        return { userData, jd, users };
    },

    /**
     * Fetches data needed for corporate user app.
     * @param {string} corporateId - The corporate ID.
     * @param {Object} fallbackTemplate - Fallback template if not found.
     * @returns {Promise<Object>}
     */
    async fetchCorporateAppData(corporateId, fallbackTemplate = {}) {
        const data = await this.fetchCorporateById(corporateId);
        return data || fallbackTemplate;
    }
};
