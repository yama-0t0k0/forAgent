/**
 * マッチングAPIクライアント
 * Cloud Run上のDart版マッチングロジックを呼び出します。
 */
import { getAuth } from 'firebase/auth';
import { MATCHING_TARGET_TYPE } from '@shared/src/core/constants/system';
import Constants from 'expo-constants';

// Cloud Run URL or Localhost (for simulator/device)
const getBaseUrl = () => {
    // 1. Environment variable (Cloud Run)
    if (process.env.EXPO_PUBLIC_MATCHING_API_URL) {
        return process.env.EXPO_PUBLIC_MATCHING_API_URL;
    }
    
    // 2. Localhost fallback
    // If running on physical device, 'localhost' won't work.
    // We try to use the host URI from Expo config (IP address of the machine running Metro)
    if (Constants.expoConfig?.hostUri) {
        const host = Constants.expoConfig.hostUri.split(':')[0];
        return `http://${host}:8080`;
    }
    
    // 3. Fallback for Simulator/Web
    return 'http://localhost:8080';
};

const API_BASE_URL = getBaseUrl();

export const MatchingService = {
    /**
     * 現在設定されているAPIのURLを取得します（デバッグ用）
     * @returns {string} API Base URL
     */
    getApiUrl() {
        return API_BASE_URL;
    },

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
                    userDoc: this._prepareDataForApi(userDoc),
                    jdDoc: this._prepareDataForApi(jdDoc)
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
                    targetDoc: this._prepareDataForApi(targetDoc),
                    candidates: this._prepareDataForApi(candidates),
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
    },

    /**
     * API送信用にデータを整形します
     * rawDataが存在する場合はそれを優先して使用します
     * @param {Object|Array} data 
     * @returns {Object|Array} 整形後のデータ
     */
    _prepareDataForApi(data) {
        if (!data) return data;
        
        // 配列の場合は各要素を再帰的に処理
        if (Array.isArray(data)) {
            return data.map(item => this._prepareDataForApi(item));
        }
        
        // User/JobDescriptionインスタンスなどでrawDataを持つ場合はそれを使用
        if (data.rawData) {
            const raw = { ...data.rawData };
            
            // APIレスポンスのマッピングのためにIDが必要
            // rawDataにIDが含まれていない場合、親オブジェクトのIDを注入する
            if (data.id && !raw.id) {
                raw.id = data.id;
            }

            // バックエンドAPIの互換性対応
            // FirestoreのJDは「スキル要件」だが、バックエンドのマッチングロジックは「スキル経験」を期待している
            if (!raw['スキル経験'] && raw['スキル要件']) {
                raw['スキル経験'] = raw['スキル要件'];
            }
            
            // 念のため英語キーもマッピング
            if (!raw['スキル経験'] && raw.skillsExperience) {
                raw['スキル経験'] = raw.skillsExperience;
            }

            return raw;
        }
        
        return data;
    }
};
