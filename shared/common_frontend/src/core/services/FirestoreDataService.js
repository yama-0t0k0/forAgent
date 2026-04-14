/**
 * Firestore Data Service
 * 共通データ取得ロジックを提供するサービス
 */

import { db, auth } from '@shared/src/core/firebaseConfig';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { User } from '@shared/src/core/models/User';
import { JobDescription } from '@shared/src/core/models/JobDescription';
import { Company } from '@shared/src/core/models/Company';
import { SelectionProgress } from '@shared/src/core/models/SelectionProgress';
import { JobDescriptionService } from './JobDescriptionService';

const FIRESTORE_OP_EQUALS = '=' + '=';
const ERROR_CODE_PERMISSION_DENIED = 'permission-denied';
const DEBUG_LOG_LIMIT = 3;

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
        const currentUser = auth.currentUser;
        const logMsg = `[FirestoreDataService] Fetching ${collectionName}. Auth: ${currentUser ? currentUser.uid : 'NULL'}`;
        console.log(logMsg);
        
        if (__DEV__) {
            const { DeviceEventEmitter } = require('react-native');
            DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', logMsg);
        }

        const snap = await getDocs(collection(db, collectionName));
        console.log(`[FirestoreDataService] Fetched ${snap.size} docs from ${collectionName}`);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
        const errorMsg = `[FirestoreDataService] Error fetching ${collectionName}: ${e.code} ${e.message}`;
        console.error(errorMsg);
        if (__DEV__) {
             const { DeviceEventEmitter } = require('react-native');
             DeviceEventEmitter.emit('FIRESTORE_IO_EVENT', errorMsg);
        }

        if (e.code === ERROR_CODE_PERMISSION_DENIED) {
             console.error(`[FirestoreDataService] PERMISSION DENIED for ${collectionName}. Check firestore.rules and current user role.`);
        }
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
        console.error(`[FirestoreDataService] Error fetching ${collectionName}/${docId}:`, e.code, e.message);
        return null;
    }
};

export const FirestoreDataService = {
    /**
     * Fetches all individuals from the 'public_profile' collection.
     * Also attempts to fetch 'private_info' if the user has permission (e.g. Admin).
     * @returns {Promise<Array<User>>}
     */
    async fetchAllIndividuals() {
        console.log('[FirestoreDataService] fetchAllIndividuals started');
        // 1. Fetch Public Profiles (Base Data)
        const publicDocs = await fetchCollection('public_profile');
        
        if (__DEV__) {
            console.log(`[Debug] fetchAllIndividuals: Fetched ${publicDocs.length} public profiles`);
            publicDocs.forEach((doc, index) => {
                if (index < DEBUG_LOG_LIMIT) { // Show first 3 only
                    console.log(`[Debug] User[${index}]: id=${doc.id}, name=${doc.name}, basicInfo=${JSON.stringify(doc.basicInfo || {})}`);
                }
            });
        }
        
        // 2. Try to fetch Private Info (Admin only)
        // Note: Non-admin users will likely fail here due to security rules, which is expected.
        let privateDocsMap = new Map();
        try {
             const snap = await getDocs(collection(db, 'private_info'));
             snap.docs.forEach(d => {
                 privateDocsMap.set(d.id, { id: d.id, ...d.data() });
             });
        } catch (e) {
            // Permission denied or fetch error -> proceed with public data only
            // Suppress error log for permission denied to avoid noise
            if (e.code !== ERROR_CODE_PERMISSION_DENIED) {
                console.warn('[FirestoreDataService] fetchAllIndividuals: Private info fetch failed:', e);
            } else {
                console.log('[FirestoreDataService] Private info fetch skipped (permission-denied).');
            }
        }

        return publicDocs.map(d => {
            const privateData = privateDocsMap.get(d.id) || null;
            return User.fromPublicPrivate(d.id, d, privateData);
        });
    },

    /**
     * Fetches a single individual by ID.
     * Combines public_profile, private_info, and users (rbac) collections.
     * @param {string} id - The individual ID.
     * @returns {Promise<User|null>}
     */
    async fetchIndividualById(id) {
        // Fetch Public Profile first
        const publicData = await fetchDocument('public_profile', id);
        
        if (!publicData) return null;

        // Fetch Private Info and Users (rbac) in parallel
        let privateData = null;
        let userData = null;

        try {
             const [privateSnap, userSnap] = await Promise.all([
                 getDoc(doc(db, 'private_info', id)),
                 getDoc(doc(db, 'users', id))
             ]);

             if (privateSnap.exists()) {
                 privateData = { id: privateSnap.id, ...privateSnap.data() };
             }
             if (userSnap.exists()) {
                 userData = { id: userSnap.id, ...userSnap.data() };
             }
        } catch (e) {
            // Permission denied or fetch error -> proceed with public data only
            if (e.code !== ERROR_CODE_PERMISSION_DENIED) {
                console.warn('[FirestoreDataService] fetchIndividualById: Supplemental data fetch failed:', e);
            }
        }
        
        // Merge order: public < private < user (users doc has highest authority for role/permissions)
        const combinedData = {
            ...(publicData || {}),
            ...(privateData || {}),
            ...(userData || {})
        };

        return User.fromFirestore(id, combinedData);
    },

    /**
     * Searches for an individual by email address.
     * Searches 'private_info' collection and then fetches full profile.
     * @param {string} email - The email to search for.
     * @returns {Promise<User|null>}
     */
    async fetchIndividualByEmail(email) {
        if (!email) return null;
        try {
            console.log(`[FirestoreDataService] Searching for user by email: ${email}`);
            const q = query(collection(db, 'private_info'), where('email', FIRESTORE_OP_EQUALS, email));
            const snap = await getDocs(q);

            if (snap.empty) {
                console.log(`[FirestoreDataService] No user found with email: ${email}`);
                return null;
            }

            const uid = snap.docs[0].id;
            console.log(`[FirestoreDataService] Found user ID: ${uid} for email: ${email}`);
            return await this.fetchIndividualById(uid);
        } catch (e) {
            console.error(`[FirestoreDataService] Error searching user by email (${email}):`, e.code, e.message);
            return null;
        }
    },

    /**
     * Fetches all job descriptions with nested JD_Number subcollections.
     * Delegates to JobDescriptionService for optimized fetching.
     * @returns {Promise<Array<JobDescription>>}
     */
    async fetchAllJobDescriptions() {
        return JobDescriptionService.listAllJobDescriptions();
    },

    /**
     * Fetches all corporates from multiple possible collection names.
     * @returns {Promise<Array<Company>>}
     */
    async fetchAllCorporates() {
        const [companiesPrimary, companiesFallback1, companiesFallback2] = await Promise.all([
            fetchCollection('Company'),
            fetchCollection('company'),
            fetchCollection('corporate')
        ]);
        const merged = mergeById([companiesPrimary, companiesFallback1, companiesFallback2]);
        return merged.map(d => Company.fromFirestore(d.id, d));
    },

    /**
     * Fetches a single corporate by ID.
     * @param {string} id - The corporate ID.
     * @param {string} [collectionName='company'] - The collection name.
     * @returns {Promise<Company|null>}
     */
    async fetchCorporateById(id, collectionName = 'company') {
        const data = await fetchDocument(collectionName, id);
        return data ? Company.fromFirestore(id, data) : null;
    },

    /**
     * Fetches all Fee Management & Job Stats data.
     * Uses 'FeeMgmtAndJobStatDB' collection (primary) and 'selection_progress' (legacy/fallback).
     * @returns {Promise<Array<SelectionProgress>>}
     */
    async fetchAllFMJS() {
        try {
            console.log('[FirestoreDataService] fetchAllFMJS started');
            
            // Fetch from both possible collections to be safe, similar to fetchAllCorporates
            const [fmjsPrimary, fmjsSecondary] = await Promise.all([
                fetchCollection('FeeMgmtAndJobStatDB'),
                fetchCollection('selection_progress')
            ]);
            
            const mergedDocs = mergeById([fmjsPrimary, fmjsSecondary]);
            console.log(`[FirestoreDataService] Fetched ${mergedDocs.length} unique docs from FeeMgmtAndJobStatDB/selection_progress`);
            
            if (__DEV__ && mergedDocs.length > 0) {
                 console.log(`[Debug] First FMJS doc: id=${mergedDocs[0].id}, data=${JSON.stringify(mergedDocs[0])}`);
            }

            return mergedDocs.map(d => SelectionProgress.fromFirestore(d.id, d));
        } catch (e) {
            console.error('[FirestoreDataService] fetchAllFMJS failed:', e);
            // Return empty array on error to prevent app crash
            return [];
        }
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
