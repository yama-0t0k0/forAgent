import { db } from '../firebaseConfig';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp, 
    arrayUnion,
    writeBatch
} from 'firebase/firestore';

/**
 * FMJS (Fee Management and Job Status) サービス
 * マッチングの作成や選考ステータスの管理を行います。
 */
export const FMJSService = {
    /**
     * すでに応募済みかどうかをチェックします。
     * 
     * @param {string} userId - エンジニアID
     * @param {string} jdId - JD番号
     * @returns {Promise<boolean>} 応募済みの場合はtrue
     */
    async checkAlreadyApplied(userId, jdId) {
        try {
            const q = query(
                collection(db, 'selection_progress'),
                where('id_individual_個人ID', '==', userId),
                where('JD_Number', '==', jdId)
            );
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('[FMJSService] Error checking application:', error);
            return false;
        }
    },

    /**
     * 求人に応募します（マッチングの作成）。
     * 
     * @param {string} userId - エンジニアID (例: C000000000000)
     * @param {string} companyId - 会社ID (例: B00000)
     * @param {string} jdId - JD番号 (例: 02)
     * @param {Object} jdData - JDのデータ（タイトル等）
     * @returns {Promise<{success: boolean, jobStatId?: string, error?: string}>} 作成結果
     */
    async applyForJob(userId, companyId, jdId, jdData = {}) {
        try {
            // 重複チェック
            const alreadyApplied = await this.checkAlreadyApplied(userId, jdId);
            if (alreadyApplied) {
                return { success: false, error: 'already_applied' };
            }

            const today = new Date();
            const dateStr = today.getFullYear() +
                String(today.getMonth() + 1).padStart(2, '0') +
                String(today.getDate()).padStart(2, '0');

            // JobStatIDの生成 (SEL-YYYYMMDD-XXXX)
            const jobStatId = `SEL-${dateStr}-${Math.floor(Math.random() * 9000) + 1000}`;
            const fmjsRef = doc(db, 'selection_progress', jobStatId);

            const newDoc = {
                JobStatID: jobStatId,
                id_individual_個人ID: userId,
                id_company_法人ID: companyId,
                JD_Number: jdId,
                UpdateTimestamp: serverTimestamp(),
                UpdateTimestamp_yyyymmddtttttt: new Date().toISOString(),
                選考進捗: {
                    fase_フェイズ: 'document_screening_書類選考',
                    status_ステータス: '未対応',
                    フェイズ履歴: [
                        {
                            フェイズ: 'document_screening_書類選考',
                            日付: dateStr,
                            ステータス: '未対応',
                            コメント: '求人応募による自動作成'
                        }
                    ]
                },
                紹介料管理: {
                    billing_amount_請求金額: 0,
                    estimated_annual_salary_想定年収: jdData.estimatedSalary || 0,
                    fee_rate_料率: 35
                }
            };

            const batch = writeBatch(db);
            
            // 1. 選考ドキュメントの作成
            batch.set(fmjsRef, newDoc);

            // 2. private_infoのallowed_companiesを更新 (PIIアクセス許可)
            const privateInfoRef = doc(db, 'private_info', userId);
            batch.set(privateInfoRef, {
                allowed_companies: arrayUnion(companyId)
            }, { merge: true });

            await batch.commit();

            return { success: true, jobStatId };
        } catch (error) {
            console.error('[FMJSService] Error applying for job:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ユーザーの応募履歴を取得します。
     * 
     * @param {string} userId - エンジニアID
     * @returns {Promise<Array>} 応募履歴リスト
     */
    async getUserApplications(userId) {
        try {
            const q = query(
                collection(db, 'selection_progress'),
                where('id_individual_個人ID', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
        } catch (error) {
            console.error('[FMJSService] Error fetching user applications:', error);
            return [];
        }
    },

    /**
     * 旧メソッド名との互換性維持
     */
    async createMatching(userId, companyId, jdId, jdData) {
        return this.applyForJob(userId, companyId, jdId, jdData);
    }
};

