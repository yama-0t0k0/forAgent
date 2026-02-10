/**
 * Fix Script: Create missing corporate users found in job_description
 * 
 * 役割:
 * - job_description に存在するが、users に存在しない CompanyID (B00000, J202601210001, etc.) を特定
 * - users コレクションに不足している corporate ユーザーを作成する
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 * 
 * 実行方法:
 * export GOOGLE_APPLICATION_CREDENTIALS='scripts/migration/serviceAccountKey.json'
 * node scripts/migration/fix_missing_corporate_users.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } else {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  }
} catch (e) {
  console.error('Error: Failed to initialize Firebase Admin.');
  process.exit(1);
}

const db = admin.firestore();

async function fixMissingUsers() {
  console.log('Starting fix: Creating missing corporate users from job_description...');
  
  try {
    const snapshot = await db.collection('job_description').get();
    console.log(`Scanning ${snapshot.size} company documents in 'job_description'...`);

    let createdCount = 0;
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const companyId = doc.id;
      const userDocRef = db.collection('users').doc(companyId);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        console.log(`[FIX] Creating missing user for Company ID: ${companyId}`);
        batch.set(userDocRef, {
          role: 'corporate',
          companyId: companyId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          note: 'Auto-created by fix_missing_corporate_users.js'
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      console.log(`\nSuccessfully created ${createdCount} missing corporate users.`);
    } else {
      console.log('\nNo missing users found.');
    }
    
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fixMissingUsers();
