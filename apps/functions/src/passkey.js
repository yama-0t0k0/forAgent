const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// TODO: Set these in environment variables
// RP_ID must match the domain of the app (or the associated domain for native apps)
const RP_ID = process.env.RP_ID || "engineer-registration-app-yama.web.app"; 
// Origin for Native Apps might vary (e.g., android:apk-key-hash:...) or be the web domain if using assetlinks
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || [
  "https://engineer-registration-app-yama.web.app",
  "android:apk-key-hash:YOUR_HASH_HERE", // TODO: Update for Android
  "ios:bundle-id:com.example.app" // TODO: Update for iOS
];

/**
 * Generate authentication options for passkey login
 * Returns challenge and other options required by the client
 */
exports.getPasskeyChallenge = onCall(async (request) => {
  logger.info("getPasskeyChallenge called", { data: request.data });

  try {
    // Generate options for authentication (login)
    // For discoverable credentials (resident keys), we don't specify allowCredentials
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
    });

    // Store challenge for verification
    // Use the challenge string as the doc ID for easy lookup later
    // We should also set an expiration (e.g. via TTL policy in Firestore)
    await db.collection('passkey_challenges').doc(options.challenge).set({
      challenge: options.challenge,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    });

    logger.info("Challenge generated", { challenge: options.challenge });

    return options;
  } catch (error) {
    logger.error("Error generating challenge", error);
    throw new HttpsError('internal', 'Failed to generate challenge');
  }
});

/**
 * Verify passkey authentication response and mint a custom token
 */
exports.verifyPasskeyAndGetToken = onCall(async (request) => {
  logger.info("verifyPasskeyAndGetToken called", { data: request.data });
  
  const { response } = request.data;
  
  if (!response) {
    throw new HttpsError('invalid-argument', 'Response data is missing');
  }

  try {
    const credentialId = response.id;
    
    // 1. Find the user/credential
    // Strategy: Look up credential in a global 'passkeys' collection or Group Query
    // Assuming structure: users/{userId}/passkeys/{credentialId}
    const passkeysRef = db.collectionGroup('passkeys');
    const snapshot = await passkeysRef.where('id', '==', credentialId).limit(1).get();

    if (snapshot.empty) {
      throw new HttpsError('not-found', 'Credential not found');
    }

    const passkeyDoc = snapshot.docs[0];
    const passkeyData = passkeyDoc.data();
    const userId = passkeyDoc.ref.parent.parent.id; // users/{userId}/passkeys/{credentialId} -> userId

    // 2. Retrieve the challenge
    // The client response includes the challenge (base64url), but we should verify against our DB
    // We can try to decode clientDataJSON to get the challenge, or iterate/lookup active challenges
    // Simplified: We assume the challenge doc ID matches the challenge in the response
    // In production, we should decode clientDataJSON to extract the challenge safely
    const clientData = JSON.parse(Buffer.from(response.clientDataJSON, 'base64').toString());
    const challenge = clientData.challenge;

    const challengeDoc = await db.collection('passkey_challenges').doc(challenge).get();

    if (!challengeDoc.exists || challengeDoc.data().used) {
      throw new HttpsError('failed-precondition', 'Invalid or used challenge');
    }

    // 3. Verify signature
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialPublicKey: passkeyData.publicKey,
        credentialID: passkeyData.id,
        counter: passkeyData.counter,
      },
    });

    if (verification.verified) {
      // 4. Update counter and mark challenge used
      const { authenticationInfo } = verification;
      await passkeyDoc.ref.update({
        counter: authenticationInfo.newCounter,
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      await challengeDoc.ref.update({ used: true });

      // 5. Mint custom token
      const customToken = await admin.auth().createCustomToken(userId);
      
      return { customToken };
    } else {
      throw new HttpsError('unauthenticated', 'Verification failed');
    }
  } catch (error) {
    logger.error("Error verifying passkey", error);
    throw new HttpsError('internal', 'Verification process failed: ' + error.message);
  }
});
