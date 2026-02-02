/**
 * マッチングAPIクライアント
 * Cloud Run上のDart版マッチングロジックを呼び出します。
 */
import { getAuth } from "firebase/auth";
import { MATCHING_TARGET_TYPE } from '@shared/src/core/constants/system';

const API_BASE_URL = process.env.EXPO_PUBLIC_MATCHING_API_URL || 'http://localhost:8080';

export const MatchingService = {
    /**
     * ユーザーと求人のマッチングスコアを取得します
     * @param {Object} userDoc 
     * @param {Object} jdDoc 
     * @returns {Promise<Object>} API response including matchingScore and netScore
     */
    async getMatchScore(userDoc, jdDoc) {
        try {
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userDoc,
                    jdDoc
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Matching API error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            // ユーザー画面にエラー帯が表示されないよう console.error を console.log に変更
            console.log('[MatchingService] Failed to fetch score:', error);
            return { matchingScore: 0, error: error.message };
        }
    },

    /**
     * リスト形式のデータをランク付けします
     * バックエンドの一括計算APIを使用します。
     * 
     * @param {Object} targetDoc 比較対象のドキュメント（ユーザーまたは求人）
     * @param {Array<Object>} candidates 候補リスト
     * @param {'jd'|'user'} [type='jd'] ターゲットの種類 ('jd': 求人に対するユーザーランク, 'user': ユーザーに対する求人ランク)
     * @returns {Promise<Array<Object>>} スコア順にソートされた候補リスト
     */
    async rankCandidates(targetDoc, candidates, type = MATCHING_TARGET_TYPE.JD) {
        if (!candidates || candidates.length === 0) return [];

        try {
            const auth = getAuth();
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // APIの仕様に合わせてパラメータを変換
            // type='jd' (default) -> targetDoc=User, candidates=JDs -> targetType='user'
            // type='user' -> targetDoc=JD, candidates=Users -> targetType='jd'
            const apiTargetType = type === MATCHING_TARGET_TYPE.JD ? 'user' : 'jd';

            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    targetDoc,
                    candidates,
                    targetType: apiTargetType
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Matching API error: ${response.status} - ${errorText}`);
            }

            const results = await response.json();
            return results; // API returns sorted list

        } catch (error) {
            console.log('[MatchingService] Failed to rank candidates:', error);
            // エラー時はスコア0で返す（画面がクラッシュしないように）
            return candidates.map(c => ({ ...c, matchingScore: 0 }));
        }
    }
};
