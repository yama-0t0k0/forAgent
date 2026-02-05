import { db } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

/**
 * FMJS (Fee Management and Job Status) サービス
 * マッチングの作成や選考ステータスの管理を行います。
 */
export const FMJSService = {
    /**
     * マッチング（FMJSレコード）を新規作成します。
     * @param {string} userId - エンジニアID (例: C000000000000)
     * @param {string} companyId - 会社ID (例: B00000)
     * @param {string} jdId - JD番号 (例: 02)
     * @param {Object} jdData - JDのデータ（タイトル等）
     * @returns {Promise<{success: boolean, jobStatId?: string, error?: any}>} 作成結果
     */
    async createMatching(userId, companyId, jdId, jdData) {
        try {
            const today = new Date();
            const dateStr = today.getFullYear() +
                String(today.getMonth() + 1).padStart(2, '0') +
                String(today.getDate()).padStart(2, '0');

            // JobStatIDの生成 (SYYYYMMDDXXXX)
            // 本来はカウンターが必要ですが、ここではタイムスタンプベースで簡易生成
            const jobStatId = `S${dateStr}${Math.floor(Math.random() * 9000) + 1000}`;

            const fmjsRef = doc(db, 'FeeMgmtAndJobStatDB', jobStatId);

            const newDoc = {
                individual_ID: userId,
                company_ID: companyId,
                JD_Number: jdId,
                UpdateTimestamp: serverTimestamp(),
                選考進捗: {
                    fase_フェイズ: '応募_書類選考',
                    status_ステータス: '未対応',
                    フェイズ履歴: [
                        {
                            フェイズ: '応募_書類選考',
                            日付: dateStr,
                            ステータス: '未対応',
                            コメント: 'システムによる自動作成'
                        }
                    ]
                },
                手数料管理簿: {
                    手数料の算出根拠: {
                        理論年収: 0,
                        紹介手数料率: 0,
                        紹介手数料額: 0
                    }
                }
            };

            await setDoc(fmjsRef, newDoc);
            return { success: true, jobStatId };
        } catch (error) {
            console.error('Error creating matching:', error);
            return { success: false, error };
        }
    }
};
