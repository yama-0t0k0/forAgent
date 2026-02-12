/**
 * Migration Script: Create corporate users in 'users' collection from existing 'company' collection
 * 
 * 役割:
 * - company コレクションの全ドキュメントIDを取得し、
 * - 対応する users ドキュメントが存在しない場合、初期データを作成する
 * 
 * 初期データ:
 * {
 *   role: 'corporate',
 *   companyId: doc.id, // 自身がCompany IDを持つ
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
 * node scripts/migration/create_corporate_users.js
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
 * Create corporate users
 */
async function createCorporateUsers() {
  console.log('Starting migration: Creating corporate users from company collection...');
  
  try {
    // 1. Get all companies
    const snapshot = await db.collection('company').get();
    console.log(`Found ${snapshot.size} documents in 'company' collection.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalCreated = 0;
    let totalSkipped = 0;

    let i = 0;
    while (i < snapshot.docs.length) {
      const docSnap = snapshot.docs[i];
      const companyId = docSnap.id;
      
      // Check if user doc already exists
      const userDocRef = db.collection('users').doc(companyId);
      const userDocSnap = await userDocRef.get();
      
      if (!userDocSnap.exists) {
        // Create new user doc for corporate
        batch.set(userDocRef, {
          role: 'corporate',
          companyId: companyId, // Self-reference for the main corporate account
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      } else {
        // Check if existing user needs update (optional safety check)
        // For now, we just skip to avoid overwriting existing data blindly
        // If needed, we could check if role is missing
        totalSkipped++;
        // console.log(`Skipping existing user: ${companyId}`);
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

createCorporateUsers();
