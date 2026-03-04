import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createClient } from "microcms-js-sdk";
import * as crypto from "crypto";

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
const webhookSecret = process.env.MICROCMS_WEBHOOK_SECRET || "dummy-webhook-secret";

console.log(`[microCMS Config] Domain: ${serviceDomain}, API Key: ${apiKey ? "******" : "MISSING"}, Webhook Secret: ${webhookSecret ? "******" : "MISSING"}`);

const client = createClient({
  serviceDomain: serviceDomain,
  apiKey: apiKey,
});

/**
 * Verify microCMS Webhook Signature
 * @param {string} signature - The signature from X-MICROCMS-Signature header
 * @param {string} body - The raw request body
 * @returns {boolean} - True if signature is valid
 */
const verifySignature = (signature: string, body: string): boolean => {
  if (!webhookSecret) {
    console.error("MICROCMS_WEBHOOK_SECRET is not set.");
    return false;
  }
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");
  
  // Use timingSafeEqual to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
};

/**
 * microCMS Webhook Handler (On-Demand Revalidation)
 * - microCMSのコンテンツ更新時に呼び出される
 * - 署名を検証し、キャッシュを無効化（削除）する
 */
export const onContentUpdate = functions.https.onRequest(async (req, res) => {
  functions.logger.info("onContentUpdate called", { structuredData: true });

  // 1. Validate Method
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // 2. Validate Signature
  const signature = req.headers["x-microcms-signature"];
  if (!signature || typeof signature !== "string") {
    functions.logger.warn("Missing or invalid signature header");
    res.status(401).send("Unauthorized");
    return;
  }

  // Cloud Functions for Firebase parses JSON body automatically if Content-Type is application/json
  // But we need raw body for HMAC. 
  // Fortunately, `req.rawBody` is available in Firebase Functions if we need it, 
  // but `req.body` is already parsed object.
  // Standard practice for microCMS webhook is JSON.
  // We need to be careful: req.rawBody might be a Buffer.
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
      functions.logger.warn("Missing raw body for signature verification");
      res.status(400).send("Bad Request: Missing body");
      return;
  }
  
  const rawBodyString = rawBody.toString('utf8');

  if (!verifySignature(signature, rawBodyString)) {
    functions.logger.warn("Invalid signature");
    res.status(401).send("Unauthorized: Invalid signature");
    return;
  }

  const payload = req.body;
  functions.logger.info("Webhook payload received", payload);

  // 3. Invalidate Cache
  // Currently we only have one cache key: "lp_home_list"
  // In a more complex app, we would check `payload.api` and `payload.id` to selectively invalidate.
  // For now, any update to `lp_home` API clears the list cache.
  
  if (payload.api === "lp_home") {
      const CACHE_COLLECTION = "lp_content_cache";
      const CACHE_KEY = "lp_home_list";
      
      try {
          await db.collection(CACHE_COLLECTION).doc(CACHE_KEY).delete();
          functions.logger.info(`Cache invalidated: ${CACHE_COLLECTION}/${CACHE_KEY}`);
          res.status(200).send("Cache invalidated");
      } catch (error) {
          functions.logger.error("Failed to invalidate cache", error);
          res.status(500).send("Internal Server Error");
      }
  } else {
      functions.logger.info(`Ignored update for API: ${payload.api}`);
      res.status(200).send("Ignored");
  }
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
