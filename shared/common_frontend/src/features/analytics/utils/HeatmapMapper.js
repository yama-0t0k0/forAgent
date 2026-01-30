/**
 * マッピング定義。スキルや志向のキー名をヒートマップのタイル番号（0〜89）に固定します。
 * Dart 側の HeatmapMapper と同期しています。
 */
export const HeatmapMapper = {
    totalTiles: 90,

    // スキル（0〜44）
    skillMapping: {
        // OS (0-4)
        'Mac': 0,
        'Linux': 1,
        'Windows': 2,
        'UNIX': 3,
        // Infra/Cloud (4-8)
        'AWS': 4,
        'GCP': 5,
        'Azure': 6,
        'Docker': 7,
        'Kubernetes': 8,

        // 言語 (9-17)
        'Python': 9,
        'Java': 10,
        'PHP': 11,
        'Ruby': 12,
        'TypeScript': 13,
        'JavaScript': 14,
        'Go': 15,
        'Dart': 16,
        'Swift': 17,

        // フレームワーク (18-26)
        'React': 18,
        'Vue.js': 19,
        'Ruby on Rails': 20,
        'Django': 21,
        'Next.js': 22,
        'Nuxt.js': 23,
        'Spring(SpringBoot)': 24,
        'Laravel': 25,
        'Angular': 26,

        // データベース (27-35)
        'MySQL': 27,
        'PostgreSQL': 28,
        'Redis': 29,
        'MongoDB': 30,
        'Elasticsearch': 31,
        'BigQuery': 32,
        'DynamoDB': 33,
        'SQL Server': 34,
        'Oracle': 35,

        // 経験・役割 (36-44)
        '新規プロダクト開発(×既存プロダクトの新機能)': 36,
        'R&D/プロトタイピング': 37,
        '運用/保守': 38,
        'プロジェクトマネジメント/ディレクション': 39,
        '要件定義': 40,
        '基本設計/技術選定': 41,
        '詳細設計/実装': 42,
        'サービスのグロース/スケール': 43,
        '顧客折衝/コンサルティング': 44,
    },

    // 志向（45〜89）
    aspirationMapping: {
        // 希望職種 (45-53)
        'サーバサイドエンジニア': 45,
        'フロントエンドエンジニア': 46,
        'インフラ系エンジニア': 47,
        'ネイティブアプリエンジニア': 48,
        '機械学習エンジニア': 49,
        'データ基盤エンジニア': 50,
        'データサイエンティスト': 51,
        'セキュリティエンジニア': 52,
        '社内SE': 53,

        // 今後の希望・重視する点 (54-62)
        '技術面でのスキルアップ': 54,
        'ビジネス面でのスキルアップ': 55,
        '専門領域を広げること': 56,
        '職位を高めて裁量をもつこと': 57,
        // (今後の希望 - スキルと同名)
        '要件定義': 58,
        '基本設計/技術選定': 59,
        '詳細設計/実装': 60,
        'プロジェクトマネジメント/ディレクション': 61,
        '組織づくり/カルチャー醸成/ピープルマネジメント': 62,

        // 追加 (63-71)
        '課題抽出/サービス企画': 63,
        '基礎研究/論文発表': 64,
        'R&D/プロトタイピング': 65,
        'サービスのグロース/スケール': 66,
    },

    /**
     * 指定されたキーに対応するタイル番号を取得します。
     * @param {string} key
     * @param {boolean} isAspiration
     * @returns {number|null}
     */
    /**
   * キーに対応するインデックスを取得します。
   * @param {string} key - スキルまたは志向性のキー
   * @param {boolean} [isAspiration=false] - 志向性の場合はtrue
   * @returns {number|null} インデックス（存在しない場合はnull）
   */
  getIndex(key, isAspiration = false) {
        if (isAspiration) {
            return this.aspirationMapping[key] ?? null;
        }
        return this.skillMapping[key] ?? null;
    },

    /**
     * 指定されたタイル番号に対応するキー（ラベル）を取得します。
     * @param {number} index
     * @returns {string|null}
     */
    getLabel(index) {
        // スキルから検索
        for (const [key, val] of Object.entries(this.skillMapping)) {
            if (val === index) return key;
        }
        // 志向から検索
        for (const [key, val] of Object.entries(this.aspirationMapping)) {
            if (val === index) return key;
        }
        return null;
    }
};
