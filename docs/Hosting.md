# ホスティングに関する全般的なドキュメント

本ドキュメントは、本プロジェクト（engineer-registration-app-yama）におけるホスティング（主に Firebase Hosting）の全体像・設定箇所・運用手順・開発チームが知っておくべき注意点をまとめる。

参考URL（ホスティングに関する全般的なWEBドキュメント）
https://design-document-site-d11f0.web.app/General/hosting_applications.html

## 1. 概要

### 1.1 このプロジェクトのホスティング方針

- Firebase Hosting を複数 site 運用する（Admin / LP / LP Dev を分離）。
- 同一の親ドメイン配下へ統一し、Passkey（WebAuthn）の RP ID / Origin の設計と整合させる。
  - 現運用の LP 本番は `latcoltd.net` を使用する。
- `.well-known`（iOS/Android のドメイン連携に必須）を安定して配信できることを最優先にする。

関連ドキュメント:
- `docs/security/Authentication_Authorization.md`
- `docs/security/LPmicroCMSWithFirebaseAuth.md`
- `reference_information_fordev/instructions/パスキー共通化方針.md`

## 2. 重要な結論（チーム向け）

- Hosting は [firebase.json](../firebase.json) が唯一の正。ドメイン、SPA ルーティング、API ルーティング、`.well-known` のレスポンスヘッダはここで決まる。
- `.well-known` は “HTTP 200” だけでなく “Content-Type: application/json” が必須（iOS/Android は厳格に判定する）。
- LP（prod）の `public` は `apps/lp_app/dist`。したがってデプロイ前に dist 内へ `.well-known` が存在することを必ず確認する（詳細は §6）。
- 深いパス（例: `/privacy`）が SPA のルーティングで動くには rewrite が必須。`lp-domain` / `admin-app` は `** -> /index.html` を設定済み。
- API の入口は target 毎。`/api/matching/**` の rewrites は必要な site に個別に入れる（現状は全 target に設定済み）。
- カスタムドメインの DNS 設定は Firebase Console の指示をそのまま反映する。Route53 の “Name” 欄で `latcoltd.net.latcoltd.net` のように二重にしない。

## 3. Hosting 構成（targets / sites / domains）

### 3.1 targets → sites（.firebaserc）

設定ファイル:
- [firebase.json](../firebase.json)
- [.firebaserc](../.firebaserc)

`firebase.json` の `hosting[].target` は `.firebaserc` により Firebase Hosting の site に対応付けられる。

| target | site（Hosting） | 既定ドメイン（web.app） | public | 役割 |
| --- | --- | --- | --- | --- |
| `admin-app` | `admin-app-site-d11f0` | `https://admin-app-site-d11f0.web.app` | `apps/admin_app/expo_frontend/dist` | 管理画面（SPA） |
| `lp-domain` | `engineer-registration-lp` | `https://engineer-registration-lp.web.app` | `apps/lp_app/dist` | LP 本番（SPA）+ `.well-known` |
| `lp-domain-dev` | `engineer-registration-lp-dev` | `https://engineer-registration-lp-dev.web.app` | `apps/lp_domain_hosting/public` | dev 用 `.well-known` 配信用（静的） |

### 3.2 カスタムドメイン（現運用）

- LP（prod）: `https://latcoltd.net` → `lp-domain`（`engineer-registration-lp`）
- LP（legacy）: `https://engineer-registration-lp.web.app`（移行互換として残す場合がある）
- Admin のサブドメイン運用（例: `admin.latcoltd.net`）は今後の導入候補（現状は web.app を利用）

## 4. firebase.json の要点（rewrites / headers）

### 4.1 SPA の rewrite（`** -> /index.html`）

- `admin-app` / `lp-domain` には SPA 用の rewrite がある。
  - 例: `/privacy` に直接アクセスしても `index.html` を返し、フロント側ルータで画面が開く。
- `lp-domain-dev` は `.well-known` 配信が主目的のため、現状は SPA rewrite を持たない。

### 4.2 API ルーティング（rewrites）

全 target に共通して入っているもの:
- `/api/matching/**` → Cloud Run `matching-functions`（`asia-northeast1`）

Admin のみ:
- `/firebase-web-authn-api` → Cloud Function `ext-firebase-web-authn-api`（Firebase Extension）

注意:
- 新しい API パスを追加する場合、必要な target 全てに rewrites を入れる（site を跨いで勝手には共有されない）。

### 4.3 `.well-known` のレスポンスヘッダ（headers）

`lp-domain` / `lp-domain-dev` は以下のヘッダを付与する:
- `Content-Type: application/json`
- `Cache-Control: no-store`

対象:
- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

## 5. デプロイ（ビルドと配布）

### 5.1 事前準備

- Firebase CLI を使用できること（`firebase` コマンド）。
- 対象プロジェクト: `.firebaserc` の `flutter-frontend-21d0a`

プロジェクト選択（例）:

```bash
firebase use flutter-frontend-21d0a
```

### 5.2 Web ビルド（dist 生成）

Firebase Hosting の `public` が `dist` を指している target は、デプロイ前に dist を生成する必要がある。

Admin（`admin-app`）:

```bash
cd apps/admin_app/expo_frontend
npx expo export -p web
```

LP（`lp-domain`）:

```bash
cd apps/lp_app
npx expo export -p web
```

補足:
- `npx expo export -p web` は Expo の Web 静的出力を `dist/` に生成する（設定/Expoのバージョンにより出力先が変わる場合があるため、最終的には `firebase.json` の `public` と一致していることを確認する）。

### 5.3 Hosting デプロイ（target 指定）

例:

```bash
firebase deploy --only hosting:lp-domain
firebase deploy --only hosting:lp-domain-dev
firebase deploy --only hosting:admin-app
```

注意:
- `.well-known` の更新だけを反映したい場合も hosting deploy が必要（ファイル配信は Hosting の静的コンテンツとして管理されるため）。

## 6. `.well-known`（AASA / Asset Links）

### 6.1 ファイルの所在（ソース）

現在リポジトリ内の `.well-known` のソースは以下にある:
- `apps/lp_domain_hosting/public/.well-known/apple-app-site-association`
- `apps/lp_domain_hosting/public/.well-known/assetlinks.json`

`lp-domain-dev` は上記をそのまま `public` として配信するため、ファイル更新 → deploy で反映される。

### 6.2 LP（prod）の注意点（dist 配信）

`lp-domain` は `public: apps/lp_app/dist` のため、dist 内に `.well-known` が無いと 404 になる。

チーム運用の必須確認:
- `apps/lp_app/dist/.well-known/apple-app-site-association` が存在する
- `apps/lp_app/dist/.well-known/assetlinks.json` が存在する

現状、`.well-known` のソースが `apps/lp_domain_hosting/public/.well-known` にあるため、デプロイ前に dist へ取り込む運用（コピー/同期）を必ず行う。

備考:
- 事故を減らすため、`.well-known` の取り込みは「人手のチェック」ではなく「ビルド/デプロイ手順として固定化」することを推奨する。
  - 例: Hosting の `predeploy`（または CI の deploy step）で、`apps/lp_domain_hosting/public/.well-known` を `apps/lp_app/dist/.well-known` へコピーしてから `firebase deploy` を実行する。

### 6.3 検証方法（HTTP 200 + Content-Type）

```bash
curl -i 'https://latcoltd.net/.well-known/apple-app-site-association'
curl -i 'https://latcoltd.net/.well-known/assetlinks.json'
```

期待値:
- `HTTP/2 200`（もしくは `200`）
- `Content-Type: application/json`

補足:
- CDN/キャッシュの影響で、`HEAD` が一時的に `404` になる等の揺れが発生することがある。検証は `GET` とし、必要に応じてキャッシュ回避（クエリ付与等）で確認する。

## 7. カスタムドメイン（Route53 × Firebase Hosting）

### 7.1 設定の原則

- Firebase Console（Hosting）でカスタムドメインを追加し、表示される DNS レコードをそのまま Route53 に反映する。
- 典型的な事故: Route53 の “Name” 欄でドメインが自動付与されることに気付かず、`latcoltd.net.latcoltd.net` のように二重になる。
  - Firebase が TXT 検証できない、証明書発行が進まない、意図しない 404/SSL エラーが起きる、などに繋がる。

### 7.2 確認項目

- Firebase Console 上で「ドメインの所有権確認」「SSL 証明書のプロビジョニング」が完了している
- `https://` でアクセスできる（証明書反映待ちの間は時間がかかる場合がある）
- `.well-known` が本番ドメインで配信できている（§6.3）

## 8. トラブルシューティング

### 8.1 特定のパスだけ 404（SPA の画面遷移はできる）

原因:
- SPA rewrite が無い、または `destination: /index.html` が target に入っていない。

対処:
- [firebase.json](../firebase.json) の該当 target に `{"source":"**","destination":"/index.html"}` を追加する。

### 8.2 `/.well-known/*` が 404 / Content-Type が違う

原因:
- `public` 配下に `.well-known` が存在しない（特に `lp-domain` = dist 配信時）。
- [firebase.json](../firebase.json) の `headers` 設定が target に入っていない。

対処:
- dist に `.well-known` を確実に含める（§6.2）。
- `headers` を確認し、対象パスとヘッダが定義されていることを確認する。

### 8.3 カスタムドメインが “確認中” から進まない

原因:
- DNS レコードが誤っている（Name 二重、TTL、タイプ違い、値違い）。
- 反映待ち（TTL / 伝播）。

対処:
- Firebase Console の表示値と Route53 のレコードを突き合わせる（機械的に一致しているか）。
- `dig` 等で TXT/A/CNAME を確認し、意図した値が返るかを見る。

## 9. 運用チェックリスト（配布前/配布後）

配布前:
- `firebase.json` の `public` と、実際に生成された出力先が一致している
- `lp-domain` の dist に `.well-known` が含まれている（§6.2）
- 変更対象の target を明確にし、不要な target を誤 deploy しない

配布後:
- 本番 URL の `/` と `/.well-known/*` を `curl -i` で確認（§6.3）
- SPA の深いパスへ直接アクセスしても表示できる（rewrite の確認）
- `/api/matching/**` が期待通り疎通する（必要に応じて Cloud Run 側のログも確認）
