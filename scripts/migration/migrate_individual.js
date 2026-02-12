/**
 * Migration Script: Split individual -> public_profile / private_info
 * 
 * 役割:
 * - individualコレクションのデータを public_profile (公開情報) と private_info (個人情報) に分離する
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 * 
 * 実行方法:
 * export GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json'
 * node scripts/migration/migrate_individual.js
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
 * Migrate individual data to public_profile and private_info
 */
async function migrate() {
  console.log('Starting migration: individual -> public_profile / private_info');
  
  try {
    const snapshot = await db.collection('individual').get();
    console.log(`Found ${snapshot.size} documents in 'individual' collection.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalProcessed = 0;

    let i = 0;
    while (i < snapshot.docs.length) {
      const docSnap = snapshot.docs[i];
      const data = docSnap.data();
      const id = docSnap.id;
      
      // Define fields to move to private_info (PII)
      // Note: Data is nested under '基本情報' in most cases
      const basicInfo = data['基本情報'] || {};
      const privateData = {};
      
      // Extract PII from '基本情報' if exists
      if (data['基本情報']) {
        // Move PII fields from basicInfo to privateData
        // Mapping based on verification: 
        // 姓, 名, メール, TEL, 住所, 生年月日, etc.
        const piiKeys = [
          '姓', '名', 'Family name(半角英)', 'First name(半角英)', 
          'メール', 'TEL', '住所', '生年月日',
          'Googleアカウント', 'GitHubアカウント', 'ハンドルネーム', // IDs might be semi-private/public, but safer in private initially? 
          // Re-eval: GitHub/HandleName might be public. 
          // But strict PII rule: Name, Email, Tel, Address, BirthDate are definitely Private.
          'パスワード' // Should definitely be private if exists
        ];

        // Also check top-level fields just in case
        const topLevelPii = [
             'name', 'nameKana', 'birthDate', 'email', 'phoneNumber', 'tel', 'address', 'resumeUrl', 'resume'
        ];

        piiKeys.forEach(key => {
            if (basicInfo[key] !== undefined) {
                if (!privateData['基本情報']) privateData['基本情報'] = {};
                privateData['基本情報'][key] = basicInfo[key];
                delete basicInfo[key]; // Remove from source object reference (which is inside publicData)
            }
        });
        
        topLevelPii.forEach(key => {
            if (data[key] !== undefined) {
                privateData[key] = data[key];
                delete data[key];
            }
        });
      }

      const publicData = { ...data };
      
      // Ensure '基本情報' in publicData only contains non-PII
      if (publicData['基本情報']) {
          // basicInfo reference was modified above (delete operations), so publicData['基本情報'] is already cleaned?
          // No, spread operator { ...data } creates a shallow copy. 
          // basicInfo = data['基本情報'] is a reference to the inner object.
          // Mutating basicInfo mutates the object inside data['基本情報'].
          // So publicData['基本情報'] will reflect the deletions IF publicData points to the same object.
          // Yes, { ...data } shallow copies the properties. data['基本情報'] is an object reference.
          // So modifying basicInfo modifies the object shared by data and publicData.
          // Correct.
      }
      
      // Ensure ID is present in both
      publicData.id = id;
      privateData.id = id;

      // Add to batch
      const publicRef = db.collection('public_profile').doc(id);
      const privateRef = db.collection('private_info').doc(id);
      
      batch.set(publicRef, publicData);
      batch.set(privateRef, privateData);
      
      count++;
      
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
    
    console.log(`Migration completed successfully. Total processed: ${totalProcessed}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
