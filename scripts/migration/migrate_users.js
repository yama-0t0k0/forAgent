/**
 * Migration Script: Extend users collection with companyId and role
 * 
 * 役割:
 * - usersコレクションの各ドキュメントに companyId と role フィールドを追加する
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 * 
 * 実行方法:
 * export GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json'
 * node scripts/migration/migrate_users.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

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
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of your service account key.');
  console.error('Example: export GOOGLE_APPLICATION_CREDENTIALS=\'/path/to/serviceAccountKey.json\'');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Migrate users data (add companyId and role)
 */
async function migrateUsers() {
  console.log('Starting migration: users extension (adding companyId, role)');
  
  try {
    const snapshot = await db.collection('users').get();
    console.log(`Found ${snapshot.size} documents in 'users' collection.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalProcessed = 0;

    let i = 0;
    while (i < snapshot.docs.length) {
      const docSnap = snapshot.docs[i];
      const data = docSnap.data();
      const update = {};
      
      // Default values for existing users
      if (data.companyId === undefined) {
        update.companyId = null;
      }
      
      if (data.role === undefined) {
        // Default to 'individual' for safety
        update.role = 'individual';
      }
      
      if (Object.keys(update).length > 0) {
        const docRef = db.collection('users').doc(docSnap.id);
        batch.set(docRef, update, { merge: true });
        count++;
      }
      
      // Commit batch if limit reached
      if (count >= batchSize) {
        await batch.commit();
        totalProcessed += count;
        console.log(`Processed ${totalProcessed} documents...`);
        batch = db.batch();
        count = 0;
      }
      i++;
    }
    
    // Commit remaining
    if (count > 0) {
      await batch.commit();
      totalProcessed += count;
    }
    
    console.log(`Migration completed successfully. Total updated: ${totalProcessed}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
