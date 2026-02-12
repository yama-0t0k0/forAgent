/**
 * Integrity Check Script: Verify job_description companyId against users collection
 * 
 * 役割:
 * - job_description コレクションの全ドキュメントを走査
 * - 各求人の companyId が users コレクションに存在するか確認
 * - 存在する users ドキュメントが role: 'corporate' を持っているか確認
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を用意し、環境変数 GOOGLE_APPLICATION_CREDENTIALS にパスを設定
 * 
 * 実行方法:
 * export GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json'
 * node scripts/migration/check_job_description_integrity.js
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
  process.exit(1);
}

const db = admin.firestore();

async function checkIntegrity() {
  console.log('Starting integrity check: job_description -> users link...');
  
  try {
    // 1. Get all root documents in job_description (which are Company IDs)
    const snapshot = await db.collection('job_description').get();
    console.log(`Found ${snapshot.size} company documents in 'job_description' collection.`);

    let validCount = 0;
    let missingCompanyCount = 0;
    let invalidRoleCount = 0;
    let totalJDs = 0;

    // Check each company document
    for (const doc of snapshot.docs) {
      const companyId = doc.id;
      
      // Check if this companyId exists in users collection
      const userDoc = await db.collection('users').doc(companyId).get();
      
      if (!userDoc.exists) {
        console.error(`[ERROR] job_description root doc (Company ID) ${companyId} missing in users collection.`);
        missingCompanyCount++;
      } else {
        const userData = userDoc.data();
        if (userData.role !== 'corporate') {
          console.error(`[ERROR] job_description root doc ${companyId} maps to user with invalid role: ${userData.role}`);
          invalidRoleCount++;
        } else {
          // Company is valid. Now check its JDs (optional but good for stats)
          const jdSnapshot = await doc.ref.collection('JD_Number').get();
          totalJDs += jdSnapshot.size;
          validCount++;
          // console.log(`  Company ${companyId}: ${jdSnapshot.size} JDs found. OK.`);
        }
      }
    }

    console.log('\n==================================================');
    console.log(`Total Company Docs in job_description: ${snapshot.size}`);
    console.log(`Total JDs found in subcollections: ${totalJDs}`);
    console.log(`Valid Companies: ${validCount}`);
    console.log(`Missing Users: ${missingCompanyCount}`);
    console.log(`Invalid User Role: ${invalidRoleCount}`);
    console.log('==================================================');
    
    if (missingCompanyCount === 0 && invalidRoleCount === 0) {
      console.log('✅ Integrity Check PASSED');
    } else {
      console.log('❌ Integrity Check FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('Integrity check failed:', error);
    process.exit(1);
  }
}

checkIntegrity();
