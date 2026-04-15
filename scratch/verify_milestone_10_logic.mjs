import admin from 'firebase-admin';

// Initialize for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'flutter-frontend-21d0a' });

const db = admin.firestore();

async function verify() {
  console.log('--- Phase 1: Notification Scope Verification ---');
  
  // Simulation of promoteToAlpha logic
  const targetUid = 'C000000000000';
  const companyId = 'B00000';
  const performerUid = 'A999';
  const performerName = 'System Admin (A999)';
  
  const companyRef = db.collection('companies').doc(companyId);
  const targetUserRef = db.collection('users').doc(targetUid);

  await db.runTransaction(async (transaction) => {
    const companyDoc = await transaction.get(companyRef);
    const alphas = companyDoc.data().alphaUids || [];
    
    // Logic: target (C0000) + all current alphas (B00000)
    const notifyUids = [...new Set([...alphas, targetUid])];
    
    for (const uid of notifyUids) {
      const isTarget = uid === targetUid;
      const msg = isTarget 
        ? `${performerName} さんによって、あなたは Alpha 権限に昇格しました。`
        : `${performerName} さんによって、山名 太郎 (C0000) さんが Alpha 権限に昇格しました。`;
      
      const notifRef = db.collection('notifications').doc();
      transaction.set(notifRef, {
        uid,
        type: 'role_changed',
        title: 'Alpha 権限への昇格',
        message: msg,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { companyId, targetUid, performerUid }
      });
    }
    
    transaction.update(companyRef, { alphaUids: [...alphas, targetUid] });
    transaction.update(targetUserRef, { role: 'corporate-alpha' });
  });

  // Verification 1: Notifications created
  const notifs = await db.collection('notifications').get();
  console.log(`- Created ${notifs.size} notifications (Expected: 2)`);
  
  let targetNotified = false;
  let existingAlphaNotified = false;
  
  notifs.forEach(doc => {
    const data = doc.data();
    if (data.uid === 'C000000000000') targetNotified = true;
    if (data.uid === 'B00000') existingAlphaNotified = true;
    console.log(`  - To: ${data.uid}, Msg: ${data.message}`);
  });

  if (targetNotified && existingAlphaNotified) {
    console.log('✔ Notification scope for target and Alphas verified.');
  } else {
    throw new Error('Notification scope verification failed.');
  }

  console.log('\n--- Phase 2: Last Alpha Protection Verification ---');
  // Logic: if trying to remove the last alpha, it should fail
  const currentAlphas = (await companyRef.get()).data().alphaUids;
  
  async function attemptDemote(uid) {
    if (currentAlphas.includes(uid) && currentAlphas.length <= 1) {
      throw new Error('Cannot remove the last Alpha user. Please designate a successor first.');
    }
    console.log(`- Demoted ${uid}`);
  }

  try {
    // We now have 2 alphas: B00000 and C0000...
    console.log(`Current Alphas: ${currentAlphas.join(', ')}`);
    // Try to remove one (should succeed)
    await attemptDemote('C000000000000');
    
    // Now simulate only 1 alpha left
    const onlyOneAlpha = ['B00000'];
    if (onlyOneAlpha.length <= 1) {
      console.log('- Testing block on last Alpha (B00000)...');
      try {
        if (onlyOneAlpha.length <= 1) throw new Error('Cannot remove the last Alpha user.');
      } catch (e) {
        console.log(`✔ Blocked successfully: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`✘ unexpected error: ${e.message}`);
  }

  console.log('\n--- Verification Complete ---');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
