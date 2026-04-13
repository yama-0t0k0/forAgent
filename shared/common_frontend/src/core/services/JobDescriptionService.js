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
};
