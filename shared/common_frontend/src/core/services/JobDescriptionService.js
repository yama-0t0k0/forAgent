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
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { JobDescription } from '../models/JobDescription';

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
     * Creates or updates a job description.
     * @param {string} companyId 
     * @param {string} jdDocId 
     * @param {Object} data - JD data
     * @returns {Promise<void>}
     */
    async saveJobDescription(companyId, jdDocId, data) {
        if (!companyId || !jdDocId) throw new Error('companyId and jdDocId are required');
        try {
            const docRef = doc(db, 'job_description', companyId, 'JD_Number', jdDocId);
            
            const payload = {
                ...data,
                updatedAt: serverTimestamp()
            };
            
            // If it's a new document, we might want to set createdAt
            // In Firestore, if we want to conditionally set createdAt, we can use merge: true 
            // but serverTimestamp() always overwrites.
            // For now, let's keep it simple.
            
            await setDoc(docRef, payload, { merge: true });
        } catch (error) {
            console.error(`[JobDescriptionService] saveJobDescription failed:`, error);
            throw error;
        }
    },

    /**
     * Deletes a job description.
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
    }
};
