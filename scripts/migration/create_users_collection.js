/**
 * Migration Script: Create users collection from existing public_profile
 * 
 * 役割:
 * - public_profile (または individual) の全ドキュメントIDを取得し、
 * - 対応する users ドキュメントが存在しない場合、初期データを作成する
 * 
 * 初期データ:
 * {
 *   role: 'individual',
 *   companyId: null,
 *   createdAt: serverTimestamp(),
 *   updatedAt: serverTimestamp()
 * }
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 * 
 * 実行方法:
 * export GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json'
 * node scripts/migration/create_users_collection.js
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
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of your service account key.');
  console.error('Example: export GOOGLE_APPLICATION_CREDENTIALS=\'/path/to/serviceAccountKey.json\'');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Create users collection
 */
async function createUsersCollection() {
  console.log('Starting migration: Creating users collection from public_profile...');
  
  try {
    // 1. Get all public profiles (individuals)
    // Note: We use public_profile as the source of truth for existing users
    const snapshot = await db.collection('public_profile').get();
    console.log(`Found ${snapshot.size} documents in 'public_profile' collection.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalCreated = 0;
    let totalSkipped = 0;

    let i = 0;
    while (i < snapshot.docs.length) {
      const docSnap = snapshot.docs[i];
      const userId = docSnap.id;
      
      // Check if user doc already exists
      const userDocRef = db.collection('users').doc(userId);
      const userDocSnap = await userDocRef.get();
      
      if (!userDocSnap.exists) {
        // Create new user doc
        batch.set(userDocRef, {
          role: 'individual',
          companyId: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      } else {
        // Skip existing
        totalSkipped++;
        // console.log(`Skipping existing user: ${userId}`);
      }
      
      // Commit batch if limit reached
      if (count >= batchSize) {
        await batch.commit();
        totalCreated += count;
        console.log(`Created ${totalCreated} users...`);
        batch = db.batch();
        count = 0;
      }
      i++;
    }
    
    // Commit remaining
    if (count > 0) {
      await batch.commit();
      totalCreated += count;
    }
    
    console.log('==================================================');
    console.log(`Migration completed successfully.`);
    console.log(`Total created: ${totalCreated}`);
    console.log(`Total skipped (already existed): ${totalSkipped}`);
    console.log('==================================================');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

createUsersCollection();
