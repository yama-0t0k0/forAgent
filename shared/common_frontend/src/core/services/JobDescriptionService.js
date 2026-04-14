// 役割（機能概要）:
// - 求人票（Job Description, JD）の Firestore CRUD を集約したサービス
// - 全企業横断の求人一覧取得（collectionGroup）によるパフォーマンス改善
// - 企業別一覧、単一取得、作成/更新（serverTimestamp）、削除を提供
// - firebase/firestore（Web SDK）を使用
//
// ディレクトリ構造:
// - shared/common_frontend/src/core/services/JobDescriptionService.js (本ファイル)
// - 依存: shared/common_frontend/src/core/firebaseConfig.js (Firestore 初期化)
// - 依存: shared/common_frontend/src/core/models/JobDescription.js (モデル変換)
//
// デプロイ・実行方法:
// - 各 Expo アプリ（admin_app / corporate_user_app / individual_user_app / lp_app）から import して利用
// - ローカル起動: bash scripts/start_expo.sh <app_name>

import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { JobDescription } from '../models/JobDescription';

const FIRESTORE_OP_EQUALS = '=' + '=';
const MIN_JD_SERIAL_NUMBER = 1;
const MAX_JD_SERIAL_NUMBER = 99;
const JD_SERIAL_NUMBER_LENGTH = 2;

/**
 * JobDescriptionService
 * Handles Firestore CRUD operations for Job Descriptions.
 * 
 * Hierarchy: job_description (collection) -> {companyId} (doc) -> JD_Number (subcollection) -> {jdNumber} (doc)
 */
export const JobDescriptionService = {
    /**
     * Fetches all job descriptions across all companies using collectionGroup.
     * This is much more efficient than iterating through companies.
     * @returns {Promise<Array<JobDescription>>}
     */
    async listAllJobDescriptions() {
        try {
            const jdQuery = query(collectionGroup(db, 'JD_Number'));
            const querySnapshot = await getDocs(jdQuery);
            
            return querySnapshot.docs.map(d => {
                // To get companyId from subdoc, we need to go up the path:
                // job_description/{companyId}/JD_Number/{jdNumber}
                // parent is JD_Number collection, parent.parent is companyId doc
                const companyId = d.ref.parent.parent ? d.ref.parent.parent.id : 'unknown';
                return JobDescription.fromFirestore(d.id, d.data(), companyId);
            });
        } catch (error) {
            console.error('[JobDescriptionService] listAllJobDescriptions failed:', error);
            throw error;
        }
    },

    /**
     * Fetches all job descriptions for a specific company.
     * @param {string} companyId 
     * @returns {Promise<Array<JobDescription>>}
     */
    async listCompanyJobDescriptions(companyId) {
        if (!companyId) throw new Error('companyId is required');
        try {
            const jdRef = collection(db, 'job_description', companyId, 'JD_Number');
            const querySnapshot = await getDocs(jdRef);
            
            return querySnapshot.docs.map(d => JobDescription.fromFirestore(d.id, d.data(), companyId));
        } catch (error) {
            console.error(`[JobDescriptionService] listCompanyJobDescriptions failed for ${companyId}:`, error);
            throw error;
        }
    },

    /**
     * Fetches a single job description.
     * @param {string} companyId 
     * @param {string} jdDocId 
     * @returns {Promise<JobDescription|null>}
     */
    async getJobDescription(companyId, jdDocId) {
        if (!companyId || !jdDocId) throw new Error('companyId and jdDocId are required');
        try {
            const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdDocId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) return null;
            
            return JobDescription.fromFirestore(docSnap.id, docSnap.data(), companyId);
        } catch (error) {
            console.error(`[JobDescriptionService] getJobDescription failed:`, error);
            throw error;
        }
    },

    /**
     * Generates the next available 2-digit serial number (01-99) for a company.
     * @param {string} companyId 
     * @returns {Promise<string>}
     * @throws {Error} If all 99 slots are full.
     */
    async getNextJdNumber(companyId) {
        const jds = await this.listCompanyJobDescriptions(companyId);
        const usedNumbers = new Set(
            jds
                .map((jd) => parseInt(jd.id, 10))
                .filter((num) => !Number.isNaN(num))
        );

        const nextNumber = Array.from({ length: MAX_JD_SERIAL_NUMBER }, (_, index) => index + MIN_JD_SERIAL_NUMBER).find(
            (num) => !usedNumbers.has(num)
        );

        if (nextNumber) {
            return String(nextNumber).padStart(JD_SERIAL_NUMBER_LENGTH, '0');
        }

        throw new Error(
            `求人票の最大登録数(${MAX_JD_SERIAL_NUMBER}件)に達しました。新しい求人を作成するには、不要な求人を削除してください。`
        );
    },

    /**
     * Checks if a JD has any ongoing selection progress (applications).
     * Used as a guard for deletion.
     * @param {string} companyId 
     * @param {string} jdNumber 
     * @returns {Promise<boolean>}
     */
    async hasOngoingSelections(companyId, jdNumber) {
        try {
            // Selection progress records are in 'selection_progress' collection
            const q = query(
                collection(db, 'selection_progress'),
                where('company_ID', FIRESTORE_OP_EQUALS, companyId),
                where('JD_Number', FIRESTORE_OP_EQUALS, jdNumber)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('[JobDescriptionService] hasOngoingSelections check failed:', error);
            // Safety first: if check fails, assume it has selections
            return true;
        }
    },

    /**
     * Updates only the visibility status of a job description.
     * @param {string} companyId 
     * @param {string} jdDocId 
     * @param {string} newStatus - 'active' | 'inactive'
     */
    async updateJobStatus(companyId, jdDocId, newStatus) {
        if (!companyId || !jdDocId) throw new Error('companyId and jdDocId are required');
        try {
            const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdDocId);
            await setDoc(docRef, { 
                status: newStatus,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error(`[JobDescriptionService] updateJobStatus failed:`, error);
            throw error;
        }
    },

    /**
     * Creates or updates a job description.
     * @param {string} companyId 
     * @param {string|null} jdDocId - If null, a new number is generated.
     * @param {Object} data - JD data
     * @returns {Promise<string>} The JD Number used.
     */
    async saveJobDescription(companyId, jdDocId, data) {
        if (!companyId) throw new Error('companyId is required');
        try {
            let finalJdId = jdDocId;
            if (!finalJdId) {
                finalJdId = await this.getNextJdNumber(companyId);
            }

            const docRef = doc(db, 'job_description', companyId, 'JD_Number', finalJdId);
            
            const payload = {
                ...data,
                JD_Number: finalJdId, // Ensure it matches doc ID
                updatedAt: serverTimestamp()
            };
            
            // If the data is a JobDescription instance, extract top-level properties if needed
            // But usually we pass the result of a form (Object)
            
            await setDoc(docRef, payload, { merge: true });
            return finalJdId;
        } catch (error) {
            console.error(`[JobDescriptionService] saveJobDescription failed:`, error);
            throw error;
        }
    },

    /**
     * Deletes a job description.
     * Note: This method does NOT check for ongoing selections.
     * Call hasOngoingSelections() before calling this if deletion guard is needed.
     * @param {string} companyId 
     * @param {string} jdDocId 
     * @returns {Promise<void>}
     */
    async deleteJobDescription(companyId, jdDocId) {
        if (!companyId || !jdDocId) throw new Error('companyId and jdDocId are required');
        try {
            const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdDocId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`[JobDescriptionService] deleteJobDescription failed:`, error);
            throw error;
        }
    },

    /**
     * Searches for job descriptions based on keywords and filters.
     * Implements client-side filtering for complex logic not supported by Firestore.
     * @param {Object} queryOptions 
     * @param {string} [queryOptions.freeWord] - Main search keyword
     * @param {string} [queryOptions.positionName] - Keyword for positionName
     * @param {string[]} [queryOptions.locations] - Geographic locations
     * @param {string[]} [queryOptions.features] - Appeal/Feature tags
     * @param {Object} [queryOptions.detailedFields] - Key-value pairs for other fields
     * @returns {Promise<Array<JobDescription>>}
     */
    async searchJobs({ freeWord, positionName, locations, features, detailedFields }) {
        try {
            const EMPTY_STRING = '';
            const SEARCH_OPERATOR = {
                OR: 'OR',
            };
            const JD_STATUS = {
                ACTIVE: 'active',
            };
            const OR_SEPARATOR = ` ${SEARCH_OPERATOR.OR} `;
            const exactPhraseRegex = new RegExp('\\u0022([^\\u0022]+)\\u0022', 'g');

            // 1. Fetch all active/public JDs first (Base set)
            // Note: In production, we might want to filter by status='active' in Firestore if possible
            const allJds = await this.listAllJobDescriptions();
            
            /**
             * Helper to parse AND/OR/Exact match logic from a keyword string.
             * @param {string} input 
             * @returns {{exact: string[], and: string[], or: string[]}}
             */
            const parseLogic = (input) => {
                if (!input) return { exact: [], and: [], or: [] };
                
                const exactMatches = [];
                const processed = input.replace(exactPhraseRegex, (_, p1) => {
                    exactMatches.push(p1.trim().toLowerCase());
                    return EMPTY_STRING;
                });

                const orParts = processed
                    .split(OR_SEPARATOR)
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);
                const andParts = processed
                    .split(/\s+/)
                    .filter((s) => s !== SEARCH_OPERATOR.OR)
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);

                return { exact: exactMatches, and: andParts, or: orParts };
            };

            const freeWordLogic = parseLogic(freeWord);
            const positionLogic = parseLogic(positionName);

            /**
             * Checks if a text matches the parsed logic.
             * @param {string} text 
             * @param {ReturnType<parseLogic>} logic 
             * @returns {boolean}
             */
            const matchesLogic = (text, logic) => {
                const target = (text || '').toLowerCase();
                if (logic.exact.length > 0 && !logic.exact.every(e => target.includes(e))) return false;
                if (logic.or.length > 1) return logic.or.some(o => target.includes(o));
                if (logic.and.length > 0) return logic.and.every(a => target.includes(a));
                return true;
            };

            return allJds.filter((jd) => {
                // Filter by status (internal check)
                if (jd.status !== JD_STATUS.ACTIVE) return false;

                // 2. Keyword Filtering (FreeWord)
                if (freeWord) {
                    const fullText = JSON.stringify(jd.rawData || {}).toLowerCase();
                    if (!matchesLogic(fullText, freeWordLogic)) return false;
                }

                // 3. Position Name Filtering
                if (positionName) {
                    if (!matchesLogic(jd.positionName, positionLogic)) return false;
                }

                // 4. Location Filtering (Multi-select)
                if (locations && locations.length > 0) {
                    const jdLocations = jd.basicItems?.['勤務地'] || {};
                    const hasMatch = locations.some((loc) => jdLocations[loc] === true);
                    if (!hasMatch) return false;
                }

                // 5. Feature Filtering (こだわり - 魅力/特徴)
                if (features && features.length > 0) {
                    // Logic: Must have at least one of the selected features
                    // Features are mapped from company.json "魅力/特徴"
                    const companyAppeal = jd.rawData?.companyInfo?.appeal || {};
                    const hasMatch = features.some((f) => companyAppeal[f] === true);
                    if (!hasMatch) return false;
                }

                // 6. Detailed Fields (Accordion)
                if (detailedFields) {
                    const filteredPairs = Object.entries(detailedFields).filter(([, value]) => {
                        if (value === undefined || value === null) return false;
                        return value !== EMPTY_STRING;
                    });

                    const hasAll = filteredPairs.every(([key, value]) => {
                        const jdValue = jd.rawData?.[key];
                        return jdValue === value;
                    });

                    if (!hasAll) return false;
                }

                return true;
            });
        } catch (error) {
            console.error('[JobDescriptionService] searchJobs failed:', error);
            throw error;
        }
    },
};
