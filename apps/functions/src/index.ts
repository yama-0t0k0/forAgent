import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { createClient } from "microcms-js-sdk";
import * as crypto from "crypto";
import * as cors from "cors";

const corsHandler = cors({ origin: true });

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
export const onContentUpdate = onRequest(async (req, res) => {
  logger.info("onContentUpdate called", { structuredData: true });

  // 1. Validate Method
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // 2. Validate Signature
  const signature = req.headers["x-microcms-signature"];
  if (!signature || typeof signature !== "string") {
    logger.warn("Missing or invalid signature header");
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
    logger.warn("Missing raw body for signature verification");
    res.status(400).send("Bad Request: Missing body");
    return;
  }

  const rawBodyString = rawBody.toString('utf8');

  if (!verifySignature(signature, rawBodyString)) {
    logger.warn("Invalid signature");
    res.status(401).send("Unauthorized: Invalid signature");
    return;
  }

  const payload = req.body;
  logger.info("Webhook payload received", payload);

  // 3. Invalidate Cache
  // Currently we only have one cache key: "lp_home_list"
  // In a more complex app, we would check `payload.api` and `payload.id` to selectively invalidate.
  // For now, any update to `lp_home` API clears the list cache.

  if (payload.api === "lp_home") {
    const CACHE_COLLECTION = "lp_content_cache";
    const CACHE_KEY = "lp_home_list";

    try {
      await db.collection(CACHE_COLLECTION).doc(CACHE_KEY).delete();
      logger.info(`Cache invalidated: ${CACHE_COLLECTION}/${CACHE_KEY}`);
      res.status(200).send("Cache invalidated");
    } catch (error) {
      logger.error("Failed to invalidate cache", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    logger.info(`Ignored update for API: ${payload.api}`);
    res.status(200).send("Ignored");
  }
});

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase Functions (Node.js)!");
});

/**
 * LPコンテンツ取得関数 (HTTPS Request)
 * - クライアントから呼び出され、microCMSのデータを返却する
 * - 認証状態に応じて、返却するデータをフィルタリングする（Phase 4で実装予定）
 */
export const getLpContent = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    logger.info("getLpContent called", { structuredData: true });

    // 1. 認証チェック
    // トークンがあれば検証してRoleを取得し、なければゲストとして扱う。

    let uid = null;
    let userPlan = "free";
    let isAdmin = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        userPlan = (decodedToken as any).plan || "free";
        isAdmin = (decodedToken as any).role === "admin";
        logger.info("Authenticated user", { uid, userPlan, isAdmin });
      } catch (error) {
        logger.warn("Invalid ID token", error);
      }
    }

    const { draftKey } = req.query;
    const isPreview = draftKey && typeof draftKey === "string";

    // プレビューモードの場合はAdmin権限必須
    if (isPreview && !isAdmin) {
      logger.warn("Unauthorized preview access attempt", { uid });
      res.status(403).send("Forbidden: Admin privileges required for preview mode");
      return;
    }

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
          logger.info("Using cached content", { key: CACHE_KEY });
          microcmsData = cacheData.data;
        }
      }

      if (!microcmsData || isPreview) {
        // 3. microCMSから取得
        const startTime = Date.now();
        logger.info("Fetching from microCMS", { isPreview, api: "lp_home" });

        microcmsData = await client.getList({
          endpoint: "lp_home",
          queries: isPreview ? { draftKey: draftKey as string } : undefined,
        });

        const duration = Date.now() - startTime;
        logger.info("microCMS fetch completed", { durationMs: duration });

        // プレビューでない場合のみキャッシュ保存
        if (!isPreview) {
          const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CACHE_DURATION_MS);
          await cacheRef.set({
            data: microcmsData,
            fetchedAt: admin.firestore.Timestamp.now(),
            expiresAt: expiresAt,
          });
          logger.info("Fetched and cached from microCMS");
        } else {
          logger.info("Preview content fetched (not cached)");
        }
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

      res.status(200).json({
        contents: filteredContents,
        totalCount: microcmsData.totalCount,
        offset: microcmsData.offset,
        limit: microcmsData.limit
      });

    } catch (error: any) {
      logger.error("Error in getLpContent", error.response?.status, error.response?.data, error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        res.status(403).send("microCMS authentication failed");
      } else if (error.response?.status === 404) {
        res.status(404).send("microCMS endpoint not found");
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  });
});
