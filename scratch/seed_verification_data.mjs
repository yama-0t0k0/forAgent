import admin from 'firebase-admin';

// Initialize for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'flutter-frontend-21d0a'
});

const db = admin.firestore();

async function seed() {
  console.log('--- Seeding Milestone 10 Verification Data ---');

  // 1. Admin User
  await db.collection('users').doc('A999').set({
    displayName: 'System Admin (A999)',
    role: 'admin',
    email: 'admin@example.com',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Individual User (Target)
  await db.collection('users').doc('C000000000000').set({
    displayName: '山名 太郎 (C0000)',
    role: 'individual',
    email: 'user_c@example.com',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Alpha User
  await db.collection('users').doc('B00000').set({
    displayName: '法人管理者 (B00000)',
    role: 'corporate-alpha',
    companyId: 'B00000',
    email: 'alpha_b@example.com',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 4. Company doc
  await db.collection('companies').doc('B00000').set({
    name: 'テスト株式会社',
    alphaUids: ['B00000'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✔ Seeding complete.');
}

seed().catch(console.error);
