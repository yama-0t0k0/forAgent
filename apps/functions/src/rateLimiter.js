const admin = require('firebase-admin');
const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Checks if the current request is within the rate limit.
 * Threshold is set to 1.5x the average of the last 7 days.
 * 
 * @param {string} functionName - Name of the function being called.
 * @throws {HttpsError} - If rate limit is exceeded.
 */
async function checkRateLimit(functionName) {
  const db = admin.firestore();
  const today = new Date().toISOString().split('T')[0];
  const statsRef = db.collection('_system').doc('usage_stats').collection('daily').doc(today);
  const configRef = db.collection('_system').doc('usage_stats');

  await db.runTransaction(async (transaction) => {
    const configSnap = await transaction.get(configRef);
    const statsSnap = await transaction.get(statsRef);

    let averageCount = 1000; // Baseline default if no history
    let isWhitelisted = false;

    if (configSnap.exists()) {
      const config = configSnap.data();
      if (config.averageUsage && config.averageUsage[functionName]) {
        averageCount = config.averageUsage[functionName];
      }
      if (config.whitelist && config.whitelist.includes(functionName)) {
        isWhitelisted = true;
      }
    }

    const threshold = averageCount * 1.5;
    const currentCount = statsSnap.exists() ? (statsSnap.data()[functionName] || 0) : 0;

    if (!isWhitelisted && currentCount > threshold) {
      // Log alert to Firestore
      const alertRef = db.collection('_system/usage_stats/alerts').doc();
      transaction.set(alertRef, {
        severity: 'CRITICAL',
        functionName,
        currentCount,
        threshold,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: `Rate limit exceeded for ${functionName}. Auto-interrupt triggered.`
      });

      console.error(`🛑 [RateLimiter] Limit exceeded for ${functionName}: ${currentCount} > ${threshold}`);
      throw new HttpsError('resource-exhausted', 'Daily usage limit exceeded. Please contact administrator.');
    }

    // Increment count
    const update = {};
    update[functionName] = admin.firestore.FieldValue.increment(1);
    update['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    
    if (statsSnap.exists()) {
      transaction.update(statsRef, update);
    } else {
      transaction.set(statsRef, update);
    }
  });
}

module.exports = { checkRateLimit };
