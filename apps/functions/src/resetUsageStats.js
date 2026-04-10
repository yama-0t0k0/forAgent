const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Daily background job to recalculate 7-day average usage.
 * Runs at 00:00 JST (15:00 UTC).
 */
exports.resetUsageStats = onSchedule({
  schedule: '0 15 * * *', // 00:00 JST
  timeZone: 'Asia/Tokyo',
  memory: '256MiB',
}, async (event) => {
  const db = admin.firestore();
  console.log('🔄 [ResetUsageStats] Starting daily average recalculation...');

  const dailyStatsRef = db.collection('_system').doc('usage_stats').collection('daily');
  const configRef = db.collection('_system').doc('usage_stats');

  // Fetch last 7 days of stats
  const lastUpdateLimit = new Date();
  lastUpdateLimit.setDate(lastUpdateLimit.getDate() - 7);
  const dateStrLimit = lastUpdateLimit.toISOString().split('T')[0];

  const snapshot = await dailyStatsRef
    .where('__name__', '>', dateStrLimit)
    .orderBy('__name__', 'desc')
    .limit(7)
    .get();

  if (snapshot.empty) {
    console.log('ℹ️ [ResetUsageStats] No historical data found.');
    return;
  }

  const totals = {};
  const count = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();
    Object.keys(data).forEach(key => {
      if (key === 'updatedAt') return;
      totals[key] = (totals[key] || 0) + (data[key] || 0);
    });
  });

  const averageUsage = {};
  Object.keys(totals).forEach(key => {
    averageUsage[key] = Math.ceil(totals[key] / count);
  });

  await configRef.set({
    averageUsage,
    lastRecalculated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('✅ [ResetUsageStats] Recalculation complete:', averageUsage);
});
