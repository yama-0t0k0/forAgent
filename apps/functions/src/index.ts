import * as functions from "firebase-functions";
import { createClient } from "microcms-js-sdk";

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
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase Functions (Node.js)!");
});

/**
 * LPコンテンツ取得関数 (Callable)
 * - クライアントから呼び出され、microCMSのデータを返却する
 * - 認証状態に応じて、返却するデータをフィルタリングする（Phase 4で実装予定）
 */
export const getLpContent = functions.https.onCall(async (data, context) => {
  functions.logger.info("getLpContent called", { structuredData: true });

  try {
    // microCMSから記事一覧を取得
    // 現時点では全件取得し、クライアント側で出し分ける想定（またはPhase 4でクエリパラメータ追加）
    const response = await client.getList({
      endpoint: "lp_home",
    });

    functions.logger.info("Fetched contents from microCMS", { count: response.totalCount });
    return response;
  } catch (error) {
    functions.logger.error("Failed to fetch from microCMS", error);
    // エラー詳細をクライアントに返さないよう、汎用的なエラーにする
    throw new functions.https.HttpsError("internal", "Failed to fetch content");
  }
});
