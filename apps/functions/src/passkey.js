const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { generateAuthenticationOptions, verifyAuthenticationResponse, generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const RP_ID = process.env.RP_ID || "engineer-registration-lp.web.app";
const RAW_EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN;
const EXPECTED_ORIGIN = RAW_EXPECTED_ORIGIN
  ? (() => {
    try {
      const parsed = JSON.parse(RAW_EXPECTED_ORIGIN);
      return parsed;
    } catch {
      return RAW_EXPECTED_ORIGIN;
    }
  })()
  : [
    "https://engineer-registration-lp.web.app",
    "ios:bundle-id:com.engineer.registration.lpapp",
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
 * Generate registration options for passkey registration
 * Returns challenge and other options required by the client for Passkey.create()
 */
exports.getPasskeyRegistrationOptions = onCall(async (request) => {
  logger.info("getPasskeyRegistrationOptions called", { auth: request.auth });

  // Authentication check: Must be logged in to register a passkey
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to register a passkey');
  }

  const { uid, token } = request.auth;
  const email = token.email || "";

  try {
    // 1. Get existing passkeys to prevent re-registering the same device
    const passkeysRef = db.collection('users').doc(uid).collection('passkeys');
    const snapshot = await passkeysRef.get();
    const excludeCredentials = snapshot.docs.map(doc => ({
      id: doc.data().id,
      type: 'public-key',
    }));

    // 2. Generate registration options
    const options = await generateRegistrationOptions({
      rpName: 'Career Dev Tool',
      rpID: RP_ID,
      userID: uid,
      userName: email,
      userDisplayName: email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials,
    });

    // 3. Store challenge for verification
    await db.collection('passkey_challenges').doc(options.challenge).set({
      challenge: options.challenge,
      uid: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
      type: 'registration',
    });

    logger.info("Registration challenge generated", { challenge: options.challenge, uid });

    return options;
  } catch (error) {
    logger.error("Error generating registration challenge", error);
    throw new HttpsError('internal', 'Failed to generate registration challenge');
  }
});

/**
 * Verify passkey registration response and save the public key
 */
exports.verifyPasskeyRegistration = onCall(async (request) => {
  logger.info("verifyPasskeyRegistration called", { auth: request.auth });

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to register a passkey');
  }

  const { uid } = request.auth;
  const { response } = request.data;

  if (!response) {
    throw new HttpsError('invalid-argument', 'Response data is missing');
  }

  try {
    // 1. Retrieve the challenge
    const clientData = JSON.parse(Buffer.from(response.clientDataJSON, 'base64').toString());
    const challenge = clientData.challenge;

    const challengeDoc = await db.collection('passkey_challenges').doc(challenge).get();

    if (!challengeDoc.exists || challengeDoc.data().used || challengeDoc.data().type !== 'registration' || challengeDoc.data().uid !== uid) {
      throw new HttpsError('failed-precondition', 'Invalid or used challenge');
    }

    // 2. Verify registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { registrationInfo } = verification;
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      // 3. Save the new passkey to Firestore
      const newPasskey = {
        id: credentialID,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        transports: response.response.transports || [],
      };

      await db.collection('users').doc(uid).collection('passkeys').doc(credentialID).set(newPasskey);
      await challengeDoc.ref.update({ used: true });

      logger.info("Passkey registered successfully", { uid, credentialID });

      return { success: true };
    } else {
      throw new HttpsError('unauthenticated', 'Verification failed');
    }
  } catch (error) {
    logger.error("Error verifying passkey registration", error);
    throw new HttpsError('internal', 'Registration verification failed: ' + error.message);
  }
});

/**
 * Temporary function to repair admin permissions and migrate data for dev
 * Sets role: admin claim and copies doc from old UID to new UID
 */
exports.repairAdminPermissions = onCall(async (request) => {
  logger.info("repairAdminPermissions called", { auth: request.auth });

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = request.auth;
  const oldUid = 'KPXa3AqE8QUUdHp9plpT9ubTOvv1'; // The old UID provided by the user

  try {
    // 1. Set Custom Claim
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    logger.info("Set admin claim for user", { uid });

    // 2. Migrate Firestore Data if needed
    const oldDocRef = db.collection('users').doc(oldUid);
    const newDocRef = db.collection('users').doc(uid);

    const oldDoc = await oldDocRef.get();
    if (oldDoc.exists) {
      const data = oldDoc.data();
      await newDocRef.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.info("Migrated Firestore data from old UID", { oldUid, newUid: uid });
    } else {
      // If old doc doesn't exist, at least ensure the new doc has admin role
      await newDocRef.set({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return { success: true, message: 'Permissions repaired and data migrated. Please re-login to see changes.' };
  } catch (error) {
    logger.error("Error in repairAdminPermissions", error);
    throw new HttpsError('internal', 'Repair failed: ' + error.message);
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
