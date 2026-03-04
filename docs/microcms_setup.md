# microCMS 環境セットアップガイド

本プロジェクトでは、LPアプリのコンテンツ管理に microCMS を利用します。
以下の手順に従って、サービスの作成とAPIスキーマの設定を行ってください。

## 1. サービスの作成

1. [microCMS管理画面](https://microcms.io/dashboard) にログインします。
2. 「サービスを新規作成」をクリックします。
3. **サービス名**: `LaT_microCMS_LP`
4. **サービスID**: `latlp`
   - このIDは後で環境変数 `MICROCMS_SERVICE_DOMAIN` として使用します。
   - 例: `engineer-reg-lp.microcms.io`

## 2. APIの作成 (LPコンテンツ)

**重要: APIキーとは異なります**
すでに発行されている「APIキー」はアクセス権限の鍵です。「APIの作成」とは、**コンテンツの箱（データベースのテーブルのようなもの）を作る作業**を指します。必ず以下の手順で作成してください。

1. 管理画面の左サイドバーにある「**コンテンツ（API）**」の右側にある **「＋」マーク**（または画面中央の「APIを作成」ボタン）をクリックします。
2. 「**自分で決める**」を選択します。
3. **API名**: `lp_home`
4. **エンドポイント**: `https://latlp.microcms.io/api/v1/lp_home`
5. **APIの型**: `リスト形式`

## 3. スキーマ定義

以下のフィールドを設定してください。

| フィールドID | 表示名 | 種類 | 必須 | 備考 |
| :--- | :--- | :--- | :--- | :--- |
| `title` | タイトル | テキストフィールド | ✅ | |
| `body` | 本文 | リッチエディタ | ✅ | |
| `thumbnail` | サムネイル | 画像 | | |
| `is_premium_only` | Premium限定 | 真偽値 | ✅ | ONの場合、Premiumユーザーのみ閲覧可能 |
| `target_company_id` | 対象企業ID | テキストフィールド | | アルムナイ限定の場合に指定 |
| `min_alumni_rank` | 必要アルムナイランク | セレクトフィールド | | 選択肢: `Lv1`, `Lv2`, `Lv3` |

## 4. APIキーの確認

1. サイドメニューの「APIキー」設定を開きます。
2. `X-MICROCMS-API-KEY` をコピーします。
3. このキーは **絶対に公開リポジトリにコミットしないでください**。

## 5. 環境変数の設定 (ローカル開発)

`apps/functions/.env` ファイルを作成し、以下の値を設定してください（git対象外）。

```bash
MICROCMS_SERVICE_DOMAIN=engineer-reg-lp  # あなたのサービスID
MICROCMS_API_KEY=your_api_key_here
```

## 6. 動作確認用コンテンツの作成

1. コンテンツ管理画面から「追加」をクリックします。
2. **テストデータA (公開用)**:
   - タイトル: `Welcome to our Service`
   - is_premium_only: `OFF`
3. **テストデータB (限定用)**:
   - タイトル: `Premium Content`
   - is_premium_only: `ON`

以上でmicroCMS側のセットアップは完了です。
