import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createClient } from "microcms-js-sdk";

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Initialize microCMS client
// Note: Environment variables should be set in .env or Firebase Config
// For local emulation, we need to ensure these values are present or use defaults
const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN || "dummy-service-domain";
const apiKey = process.env.MICROCMS_API_KEY || "dummy-api-key";

console.log(`[microCMS Config] Domain: ${serviceDomain}, API Key: ${apiKey ? "******" : "MISSING"}`);

const client = createClient({
  serviceDomain: serviceDomain,
  apiKey: apiKey,
});

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase Functions (Node.js)!");
});

/**
 * LPコンテンツ取得関数 (Callable)
 * - クライアントから呼び出され、microCMSのデータを返却する
 * - 認証状態に応じて、返却するデータをフィルタリングする（Phase 4で実装予定）
 */
export const getLpContent = functions.https.onCall(async (data, context) => {
  functions.logger.info("getLpContent called", { structuredData: true });

  // 1. 認証チェック
  // LP自体は未ログインでも閲覧可能だが、コンテンツごとにフィルタリングするため
  // context.auth の有無を確認しておく
  const uid = context.auth?.uid;
  const userPlan = context.auth?.token?.plan || "free";
  const userRole = context.auth?.token?.role || "individual";

  functions.logger.info("Auth Context", { uid, userPlan, userRole });

  const CACHE_COLLECTION = "lp_content_cache";
  const CACHE_KEY = "lp_home_list";
  const CACHE_DURATION_MS = 60 * 60 * 1000; // 1時間

  try {
    let microcmsData;

    // 2. キャッシュ確認
    const cacheRef = db.collection(CACHE_COLLECTION).doc(CACHE_KEY);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data();
      const now = admin.firestore.Timestamp.now();

      if (cacheData && cacheData.expiresAt && cacheData.expiresAt > now) {
        functions.logger.info("Using cached content", { key: CACHE_KEY });
        microcmsData = cacheData.data;
      }
    }

    if (!microcmsData) {
      // 3. microCMSから取得
      microcmsData = await client.getList({
        endpoint: "lp_home",
      });

      // キャッシュ保存
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CACHE_DURATION_MS);
      await cacheRef.set({
        data: microcmsData,
        fetchedAt: admin.firestore.Timestamp.now(),
        expiresAt: expiresAt,
      });
      functions.logger.info("Fetched and cached from microCMS");
    }

    // 4. 認可レベルに応じたフィルタリング
    // microCMSのレスポンス形式: { contents: [...], totalCount: N, offset: 0, limit: 10 }
    const filteredContents = microcmsData.contents.map((item: any) => {
      const isPremiumOnly = item.is_premium_only === true;

      // 権限チェック: Premium限定かつユーザーがPremiumでない場合
      if (isPremiumOnly && userPlan !== "premium") {
        return {
          ...item,
          body: "【会員限定コンテンツ】この内容はプレミアムプランの方のみご覧いただけます。",
          is_locked: true, // フロントエンド用のフラグ
        };
      }

      return {
        ...item,
        is_locked: false,
      };
    });

    return {
      ...microcmsData,
      contents: filteredContents,
    };
  } catch (error) {
    functions.logger.error("Failed in getLpContent", error);
    throw new functions.https.HttpsError("internal", "Failed to process content request");
  }
});
