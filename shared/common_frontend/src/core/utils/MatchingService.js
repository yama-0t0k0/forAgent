/**
 * マッチングAPIクライアント
 * Cloud Run上のDart版マッチングロジックを呼び出します。
 */

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
            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            console.error('[MatchingService] Failed to fetch score:', error);
            return { matchingScore: 0, error: error.message };
        }
    },

    /**
     * リスト形式のデータをランク付けします（プロトタイプ版）
     * ※ 本来はバックエンド側でバッチ処理することが望ましいですが、
     * 現状の画面ロジックを維持するため、個別にAPIを叩く暫定的な実装です。
     * 
     * @param {Object} targetDoc 比較対象のドキュメント（ユーザーまたは求人）
     * @param {Array<Object>} candidates 候補リスト
     * @param {'jd'|'user'} [type='jd'] ターゲットの種類 ('jd': 求人に対するユーザーランク, 'user': ユーザーに対する求人ランク)
     * @returns {Promise<Array<Object>>} スコア順にソートされた候補リスト
     */
    async rankCandidates(targetDoc, candidates, type = 'jd') {
        /**
         * 候補者ごとにマッチングスコアを計算する内部関数
         * @param {Object} candidate - 候補データ
         * @returns {Promise<Object>} スコア付き候補データ
         */
        const processCandidate = async (candidate) => {
            const userDoc = type === 'jd' ? targetDoc : candidate;
            const jdDoc = type === 'jd' ? candidate : targetDoc;

            const result = await this.getMatchScore(userDoc, jdDoc);
            return {
                ...candidate,
                matchingScore: result.matchingScore,
                matchDetails: result
            };
        };

        const promises = candidates.map(processCandidate);

        const results = await Promise.all(promises);
        return results.sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0));
    }
};
