const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const logger = require("firebase-functions/logger");
const { generateAuthenticationOptions, verifyAuthenticationResponse, generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_RP_ID = "latcoltd.net";
const DEFAULT_ALLOWED_RP_IDS = [
  "latcoltd.net",
  "engineer-registration-lp.web.app",
  "engineer-registration-lp.firebaseapp.com",
  "engineer-registration-lp-dev.web.app",
  "engineer-registration-lp-dev.firebaseapp.com",
  "admin-app-site-d11f0.web.app",
  "admin-app-site-d11f0.firebaseapp.com",
];
const DEFAULT_EXPECTED_ORIGINS = [
  "https://latcoltd.net",
  "https://www.latcoltd.net",
  "https://engineer-registration-lp.web.app",
  "https://engineer-registration-lp.firebaseapp.com",
  "https://engineer-registration-lp-dev.web.app",
  "https://engineer-registration-lp-dev.firebaseapp.com",
  "https://admin-app-site-d11f0.web.app",
  "https://admin-app-site-d11f0.firebaseapp.com",
  "ios:bundle-id:com.engineer.registration.lpapp",
];

const FALLBACK_RP_ID = process.env.PASSKEY_RP_ID || process.env.RP_ID || DEFAULT_RP_ID;

const sha256Hex = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const getAuthUid = (request) => {
  if (!request?.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  return request.auth.uid;
};

const writePasskeyAuditLog = async ({ action, uid, credentialIdHash, origin, rpId }) => {
  await db.collection('audit_logs').add({
    action,
    uid,
    credentialIdHash: credentialIdHash || null,
    origin: origin || null,
    rpId: rpId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const parseExpectedOrigins = (raw) => {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim());
    }
    if (typeof parsed === 'string' && parsed.trim().length > 0) {
      return [parsed.trim()];
    }
    return null;
  } catch {
    const split = raw
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    return split.length > 0 ? split : null;
  }
};

const EXPECTED_ORIGINS =
  parseExpectedOrigins(process.env.EXPECTED_ORIGINS) ||
  parseExpectedOrigins(process.env.EXPECTED_ORIGIN) ||
  DEFAULT_EXPECTED_ORIGINS;

const ALLOWED_RP_IDS = (() => {
  const fromEnv = parseExpectedOrigins(process.env.PASSKEY_RP_IDS) || [];
  const merged = [...fromEnv, FALLBACK_RP_ID, ...DEFAULT_ALLOWED_RP_IDS]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim());
  return Array.from(new Set(merged));
})();

const getOriginFromHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') return null;
  const origin =
    headers.origin ||
    headers.Origin ||
    headers.referer ||
    headers.Referer ||
    headers.referrer ||
    headers.Referrer;
  if (typeof origin !== 'string') return null;
  const trimmed = origin.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getHostnameFromOrigin = (origin) => {
  if (typeof origin !== 'string' || origin.trim().length === 0) return null;
  try {
    return new URL(origin.trim()).hostname || null;
  } catch {
    return null;
  }
};

const resolveRpIdFromRequest = (request, { strictRequested = false } = {}) => {
  const data = request?.data;
  const requested = data?.rpId || data?.rpID;
  if (typeof requested === 'string') {
    const normalized = requested.trim();
    if (normalized.length > 0) {
      if (ALLOWED_RP_IDS.includes(normalized)) {
        return normalized;
      }
      if (strictRequested) {
        throw new HttpsError('invalid-argument', 'rpId is not allowed');
      }
    }
  }
  const origin = getOriginFromHeaders(request?.rawRequest?.headers || request?.headers);
  const hostname = getHostnameFromOrigin(origin);
  if (hostname && ALLOWED_RP_IDS.includes(hostname)) {
    return hostname;
  }
  return FALLBACK_RP_ID;
};

const toBase64UrlString = (value) => Buffer.from(value).toString('base64url');

const toCredentialIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return toBase64UrlString(value);
  if (value instanceof Uint8Array) return toBase64UrlString(value);
  if (typeof value?.toBase64 === 'function') {
    return String(value.toBase64()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  return null;
};

const toCredentialIdBuffer = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    try {
      return Buffer.from(value, 'base64url');
    } catch {
      return null;
    }
  }
  if (typeof value?.toUint8Array === 'function') {
    try {
      return Buffer.from(value.toUint8Array());
    } catch {
      return null;
    }
  }
  return null;
};

const decodeBase64OrBase64UrlToJson = (encoded) => {
  if (typeof encoded !== 'string' || encoded.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'clientDataJSON is missing');
  }

  const raw = encoded.trim();
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString());
  } catch {
    return JSON.parse(Buffer.from(raw, 'base64url').toString());
  }
};

const getClientDataJSONFromResponse = (response) => {
  const top = response?.clientDataJSON;
  if (typeof top === 'string' && top.trim().length > 0) {
    return top;
  }

  const nested = response?.response?.clientDataJSON;
  if (typeof nested === 'string' && nested.trim().length > 0) {
    return nested;
  }

  return null;
};

/**
 * Generate authentication options for passkey login
 * Returns challenge and other options required by the client
 */
exports.getPasskeyChallenge = onCall(async (request) => {
  logger.info("getPasskeyChallenge called", { data: request.data });

  try {
    const rpId = resolveRpIdFromRequest(request, { strictRequested: true });

    // Generate options for authentication (login)
    // For discoverable credentials (resident keys), we don't specify allowCredentials
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      userVerification: 'preferred',
    });

    // Store challenge for verification
    // Use the challenge string as the doc ID for easy lookup later
    // We should also set an expiration (e.g. via TTL policy in Firestore)
    await db.collection('passkey_challenges').doc(options.challenge).set({
      challenge: options.challenge,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
      type: 'authentication',
      rpId: rpId,
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
  const email =
    (typeof token?.email === 'string' && token.email.trim().length > 0 && token.email.trim()) ||
    (typeof token?.phone_number === 'string' && token.phone_number.trim().length > 0 && token.phone_number.trim()) ||
    uid;

  try {
    const rpId = resolveRpIdFromRequest(request, { strictRequested: true });

    // 1. Get existing passkeys to prevent re-registering the same device
    const passkeysRef = db.collection('users').doc(uid).collection('passkeys');
    const snapshot = await passkeysRef.get();
    const excludeCredentials = snapshot.docs
      .map((doc) => {
        const id = toCredentialIdBuffer(doc.data()?.id);
        if (!id) return null;
        return { id, type: 'public-key' };
      })
      .filter((v) => v);

    // 2. Generate registration options
    const options = await generateRegistrationOptions({
      rpName: 'Career Dev Tool',
      rpID: rpId,
      userID: Buffer.from(uid, 'utf8'),
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
      rpId: rpId,
    });

    logger.info("Registration challenge generated", { challenge: options.challenge, uid });

    return options;
  } catch (error) {
    const message = typeof error?.message === 'string' ? error.message : 'unknown_error';
    logger.error("Error generating registration challenge", {
      uid,
      message,
      stack: typeof error?.stack === 'string' ? error.stack : null,
      rpId: resolveRpIdFromRequest(request),
    });
    throw new HttpsError('internal', `Failed to generate registration challenge: ${message}`);
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
  const origin = getOriginFromHeaders(request?.rawRequest?.headers || request?.headers);
  const { response } = request.data;

  if (!response) {
    throw new HttpsError('invalid-argument', 'Response data is missing');
  }

  const rpIdFromRequest = resolveRpIdFromRequest(request);

  try {
    // 1. Retrieve the challenge
    const clientDataJSON = getClientDataJSONFromResponse(response);
    const clientData = decodeBase64OrBase64UrlToJson(clientDataJSON);
    const challenge = clientData.challenge;

    const challengeDoc = await db.collection('passkey_challenges').doc(challenge).get();

    if (!challengeDoc.exists || challengeDoc.data().used || challengeDoc.data().type !== 'registration' || challengeDoc.data().uid !== uid) {
      throw new HttpsError('failed-precondition', 'Invalid or used challenge');
    }

    const rpId = typeof challengeDoc.data().rpId === 'string' ? challengeDoc.data().rpId : FALLBACK_RP_ID;

    // 2. Verify registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: rpId,
    });

    if (verification.verified && verification.registrationInfo) {
      const { registrationInfo } = verification;
      const { credentialPublicKey, credentialID, counter } = registrationInfo;
      const credentialIdString = toBase64UrlString(credentialID);

      // 3. Save the new passkey to Firestore
      const newPasskey = {
        id: credentialIdString,
        publicKey: Buffer.from(credentialPublicKey),
        counter,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        transports: response?.response?.transports || response?.transports || [],
      };

      await db.collection('users').doc(uid).collection('passkeys').doc(credentialIdString).set(newPasskey);
      await challengeDoc.ref.update({ used: true });

      await writePasskeyAuditLog({
        action: 'passkey_register_success',
        uid,
        credentialIdHash: sha256Hex(credentialIdString),
        origin,
        rpId,
      });

      logger.info("Passkey registered successfully", { uid, credentialID: credentialIdString });

      return { success: true };
    } else {
      throw new HttpsError('unauthenticated', 'Verification failed');
    }
  } catch (error) {
    const errorCode = typeof error?.code === 'string' ? error.code : 'internal';
    const errorMessage = typeof error?.message === 'string' ? error.message : 'unknown_error';

    await writePasskeyAuditLog({
      action: 'passkey_register_failure',
      uid,
      origin,
      rpId: rpIdFromRequest,
    });

    logger.error("Error verifying passkey registration", {
      uid,
      origin,
      rpId: rpIdFromRequest,
      errorCode,
      errorMessage,
      stack: typeof error?.stack === 'string' ? error.stack : null,
    });
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
  const origin = getOriginFromHeaders(request?.rawRequest?.headers || request?.headers);
  const rpIdFromRequest = resolveRpIdFromRequest(request);

  if (!response) {
    throw new HttpsError('invalid-argument', 'Response data is missing');
  }

  try {
    const credentialId = response.id;

    // 1. Find the user/credential
    // Strategy: Look up credential in a global 'passkeys' collection or Group Query
    // Assuming structure: users/{userId}/passkeys/{credentialId}
    const passkeysRef = db.collectionGroup('passkeys');
    let snapshot = await passkeysRef.where('id', '==', credentialId).limit(1).get();
    if (snapshot.empty) {
      const maybeBuffer = toCredentialIdBuffer(credentialId);
      if (maybeBuffer) {
        snapshot = await passkeysRef.where('id', '==', maybeBuffer).limit(1).get();
      }
    }

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
    const clientDataJSON = getClientDataJSONFromResponse(response);
    const clientData = decodeBase64OrBase64UrlToJson(clientDataJSON);
    const challenge = clientData.challenge;

    const challengeDoc = await db.collection('passkey_challenges').doc(challenge).get();

    if (!challengeDoc.exists || challengeDoc.data().used || challengeDoc.data().type !== 'authentication') {
      throw new HttpsError('failed-precondition', 'Invalid or used challenge');
    }

    const rpId = typeof challengeDoc.data().rpId === 'string' ? challengeDoc.data().rpId : FALLBACK_RP_ID;

    // 3. Verify signature
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: rpId,
      authenticator: {
        credentialPublicKey: passkeyData.publicKey,
        credentialID: toCredentialIdBuffer(passkeyData.id),
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

      await writePasskeyAuditLog({
        action: 'passkey_auth_success',
        uid: userId,
        credentialIdHash: sha256Hex(String(credentialId || passkeyData?.id || '')),
        origin,
        rpId,
      });

      return { customToken };
    } else {
      throw new HttpsError('unauthenticated', 'Verification failed');
    }
  } catch (error) {
    const errorCode = typeof error?.code === 'string' ? error.code : 'internal';
    const errorMessage = typeof error?.message === 'string' ? error.message : 'unknown_error';

    await writePasskeyAuditLog({
      action: 'passkey_auth_failure',
      uid: null,
      origin,
      rpId: rpIdFromRequest,
    });

    logger.error("Error verifying passkey", {
      origin,
      rpId: rpIdFromRequest,
      errorCode,
      errorMessage,
      stack: typeof error?.stack === 'string' ? error.stack : null,
    });
    throw new HttpsError('internal', 'Verification process failed: ' + error.message);
  }
});

exports.listPasskeys = onCall(async (request) => {
  const uid = getAuthUid(request);
  const origin = getOriginFromHeaders(request?.rawRequest?.headers || request?.headers);
  const rpId = resolveRpIdFromRequest(request);

  try {
    const passkeysRef = db.collection('users').doc(uid).collection('passkeys');
    const snapshot = await passkeysRef.select('createdAt', 'lastUsed', 'transports', 'label', 'deviceName').get();
    const passkeys = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const idString = toCredentialIdString(data.id) || doc.id;
      const credentialIdHash = sha256Hex(idString);
      return {
        credentialIdHash,
        createdAt: data.createdAt || null,
        lastUsed: data.lastUsed || null,
        transports: Array.isArray(data.transports) ? data.transports : [],
        label: typeof data.label === 'string' ? data.label : null,
        deviceName: typeof data.deviceName === 'string' ? data.deviceName : null,
      };
    });

    await writePasskeyAuditLog({
      action: 'passkey_list',
      uid,
      origin,
      rpId,
    });

    return { passkeys };
  } catch (error) {
    logger.error("Error listing passkeys", error);
    throw new HttpsError('internal', 'Failed to list passkeys');
  }
});

exports.deletePasskey = onCall(async (request) => {
  const uid = getAuthUid(request);
  const origin = getOriginFromHeaders(request?.rawRequest?.headers || request?.headers);
  const rpId = resolveRpIdFromRequest(request);

  const credentialIdHashInput =
    typeof request?.data?.credentialIdHash === 'string' && request.data.credentialIdHash.trim().length > 0
      ? request.data.credentialIdHash.trim()
      : null;
  const credentialIdInput =
    typeof request?.data?.credentialId === 'string' && request.data.credentialId.trim().length > 0
      ? request.data.credentialId.trim()
      : null;

  if (!credentialIdInput && !credentialIdHashInput) {
    throw new HttpsError('invalid-argument', 'credentialId or credentialIdHash is required');
  }

  try {
    const passkeysRef = db.collection('users').doc(uid).collection('passkeys');

    if (credentialIdInput) {
      const targetRef = passkeysRef.doc(credentialIdInput);
      const targetDoc = await targetRef.get();
      if (!targetDoc.exists) {
        throw new HttpsError('not-found', 'Passkey not found');
      }

      const data = targetDoc.data() || {};
      const idString = toCredentialIdString(data.id) || targetDoc.id;
      const credentialIdHash = sha256Hex(idString);

      await targetRef.delete();
      await writePasskeyAuditLog({
        action: 'passkey_delete',
        uid,
        credentialIdHash,
        origin,
        rpId,
      });
      return { success: true };
    }

    const snapshot = await passkeysRef.select('id').get();
    const targetDoc = snapshot.docs.find((doc) => {
      const data = doc.data() || {};
      const idString = toCredentialIdString(data.id) || doc.id;
      return sha256Hex(idString) === credentialIdHashInput;
    });

    if (!targetDoc) {
      throw new HttpsError('not-found', 'Passkey not found');
    }

    const data = targetDoc.data() || {};
    const idString = toCredentialIdString(data.id) || targetDoc.id;
    const credentialIdHash = sha256Hex(idString);

    await targetDoc.ref.delete();
    await writePasskeyAuditLog({
      action: 'passkey_delete',
      uid,
      credentialIdHash,
      origin,
      rpId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("Error deleting passkey", error);
    throw new HttpsError('internal', 'Failed to delete passkey');
  }
});
