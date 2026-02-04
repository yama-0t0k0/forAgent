/**
 * Migration Script: Split individual -> public_profile / private_info
 * 
 * 役割:
 * - individualコレクションのデータを public_profile (公開情報) と private_info (個人情報) に分離する
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、以下のいずれかの方法で設定:
 *    - 環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 *    - または、このスクリプトと同じディレクトリに serviceAccountKey.json を配置
 * 
 * 実行方法:
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
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = require(keyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      throw new Error('Credentials not found');
    }
  }
} catch (e) {
  console.error('Error: Failed to initialize Firebase Admin.');
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in scripts/migration/');
  process.exit(1);
}

const db = admin.firestore();

async function migrate() {
  console.log('Starting migration: individual -> public_profile / private_info');
  
  try {
    const snapshot = await db.collection('individual').get();
    console.log(`Found ${snapshot.size} documents in 'individual' collection.`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let totalProcessed = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      
      // Define fields to move to private_info (PII)
      const privateFields = [
        'name', 'nameKana', 
        'birthDate', 
        'email', 
        'phoneNumber', 'tel',
        'address', 'detailAddress', 'postalCode',
        'resumeUrl', 'resume',
        'エージェント使用欄'
      ];
      
      const privateData = {};
      const publicData = { ...data };
      
      privateFields.forEach(field => {
        if (data[field] !== undefined) {
          privateData[field] = data[field];
          delete publicData[field];
        }
      });
      
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
