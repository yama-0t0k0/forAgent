const { onUserCreated } = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

/**
 * Triggered when a new user is created in Firebase Auth.
 * Assigns the default 'individual' role and initializes the user document.
 */
exports.onUserCreated = onUserCreated(async (event) => {
  const user = event.data;
  const uid = user.uid;
  const email = user.email;

  logger.info(`Processing new user registration: ${uid} (${email})`);

  try {
    // 1. Assign Custom Claim (role: 'individual')
    // note: In a production app, you might want to check if they already have claims
    await admin.auth().setCustomUserClaims(uid, {
      role: "individual",
    });
    logger.info(`Assigned 'individual' role to user: ${uid}`);

    // 2. Initialize users/{uid} document if it doesn't exist
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        uid: uid,
        email: email || null,
        role: "individual",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.info(`Initialized user document for: ${uid}`);
    }

    return null;
  } catch (error) {
    logger.error(`Error in onUserCreated for ${uid}:`, error);
    throw error;
  }
});
