import { db } from '../firebaseConfig';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDocs, query, orderBy, limit, arrayUnion } from 'firebase/firestore';

/**
 * FMJS (Fee Management and Job Status) サービス
 * マッチングの作成や選考ステータスの管理を行います。
 */
export const FMJSService = {
    /**
     * マッチング（FMJSレコード）を新規作成します。
     * また、Step 4要件に従い、エンジニアのprivate_infoのallowed_companiesを更新します。
     * 
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

            // Step 4: private_infoのallowed_companiesを更新
            // これにより、企業側がエンジニアの個人情報(PII)にアクセスできるようになる
            try {
                const privateInfoRef = doc(db, 'private_info', userId);
                // Use setDoc with merge: true to ensure it works even if private_info doc doesn't exist yet
                await setDoc(privateInfoRef, {
                    allowed_companies: arrayUnion(companyId)
                }, { merge: true });
            } catch (piiError) {
                console.warn('[FMJSService] Failed to update allowed_companies in private_info:', piiError);
                // private_infoが存在しない場合(古いデータなど)は無視するか、エラーとして扱うか検討
                // 現状はログ出力にとどめ、マッチング自体は成功とする
            }

            return { success: true, jobStatId };
        } catch (error) {
            console.error('Error creating matching:', error);
            return { success: false, error };
        }
    }
};
