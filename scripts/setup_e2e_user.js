const admin = require('firebase-admin');

// 1. Initialize admin SDK (relies on GOOGLE_APPLICATION_CREDENTIALS or gcloud auth application-default login)
try {
  // Try normal initialization (will use GOOGLE_APPLICATION_CREDENTIALS if set, or application default login)
  admin.initializeApp({
      projectId: 'flutter-frontend-21d0a'
  });
} catch (e) {
  console.error('Firebase Admin init failed:', e);
  process.exit(1);
}

const db = admin.firestore();
const authAdmin = admin.auth();

const USERS = [
  {
    uid: 'A999',
    email: 'e2e-test-A999@lat-inc.com',
    password: 'E2ePassword2026!',
    role: 'admin',
    displayName: 'E2E Admin Tester',
    companyId: null,
    setupData: async (db) => {
      // Setup users collection
      await db.collection('users').doc('A999').set({
        role: 'admin',
        companyId: null,
        email: 'e2e-test-A999@lat-inc.com',
        displayName: 'E2E Admin Tester',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Updated users/A999`);
    }
  },
  {
    uid: 'B00001',
    email: 'e2e-test-B00001@lat-inc.com',
    password: 'E2ePassword2026!',
    role: 'corporate',
    displayName: 'E2E Corporate Tester',
    companyId: 'B00001', // Important: Link to existing dummy company B00001
    setupData: async (db) => {
      // Merge into users collection
      await db.collection('users').doc('B00001').set({
        role: 'corporate',
        companyId: 'B00001',
        email: 'e2e-test-B00001@lat-inc.com',
        displayName: 'E2E Corporate Tester',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Updated users/B00001`);
    }
  },
  {
    uid: 'C000000000001',
    email: 'e2e-test-C000000000001@lat-inc.com',
    password: 'E2ePassword2026!',
    role: 'individual',
    displayName: 'E2E Test User',
    companyId: null,
    setupData: async (db) => {
      const UID = 'C000000000001';
      // Setup users collection
      await db.collection('users').doc(UID).set({
        role: 'individual',
        companyId: null,
        email: 'e2e-test-C000000000001@lat-inc.com',
        displayName: 'E2E Test User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Updated users/${UID}`);

      // Setup public_profile
      await db.collection('public_profile').doc(UID).set({
        role: 'individual',
        職歴: [
          {
            company: '株式会社ダミーAI',
            position: 'Machine Learning Engineer',
            period: '2020-04-01 ~ 現在',
            description: 'LLMのファインチューニングや推薦システムの構築'
          }
        ],
        スキル経験: ['Python', 'PyTorch', 'TensorFlow', 'GCP', 'TypeScript'],
        希望条件: 'フルリモート希望、年収800万円〜',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Updated public_profile/${UID}`);

      // Setup private_info
      await db.collection('private_info').doc(UID).set({
        '基本情報': {
          '姓': 'Ｅ２Ｅ',
          '名': 'テスト',
          'Family name(半角英)': 'E2E',
          'First name(半角英)': 'Test',
          'メール': 'e2e-test-C000000000001@lat-inc.com',
          'TEL': '090-0000-0000',
          '住所': '東京都渋谷区ダミー1-2-3',
          '生年月日': '1990-01-01',
          'Googleアカウント': 'e2e-test-C000000000001@lat-inc.com',
          'GitHubアカウント': 'e2e-test-github',
          'ハンドルネーム': 'E2E Tester'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`[Firestore] Updated private_info/${UID}`);
    }
  }
];

async function setupE2eUser() {
  console.log(`Starting E2E test users setup...`);

  for (const user of USERS) {
    console.log(`\n=======================================`);
    console.log(`Setting up user: ${user.uid} (Role: ${user.role})`);

    // 1. Create or Update Firebase Auth User
    try {
      let userRecord;
      try {
        userRecord = await authAdmin.getUser(user.uid);
        console.log(`[Auth] User ${user.uid} already exists. Updating password...`);
        await authAdmin.updateUser(user.uid, { password: user.password, email: user.email, displayName: user.displayName });
      } catch (authErr) {
        if (authErr.code === 'auth/user-not-found') {
          userRecord = await authAdmin.createUser({
            uid: user.uid,
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            disabled: false
          });
          console.log(`[Auth] Created user ${user.uid}`);
        } else {
          throw authErr;
        }
      }
      
      // Set custom claims (include companyId if applicable)
      const claims = { role: user.role };
      if (user.companyId) {
        claims.companyId = user.companyId;
      }
      await authAdmin.setCustomUserClaims(user.uid, claims);
      console.log(`[Auth] Set custom claims ${JSON.stringify(claims)} on ${user.uid}`);
    } catch (err) {
      console.error(`[Auth] Error for ${user.uid}: ${err.message}`);
      process.exit(1);
    }

    // 2. Setup Firestore Data
    try {
      await user.setupData(db);
    } catch (err) {
      console.error(`[Firestore] Error for ${user.uid}: ${err.message}`);
      process.exit(1);
    }

    console.log(`✅ Setup complete for ${user.uid}`);
  }

  console.log('\n=======================================');
  console.log('🎉 All E2E Users Setup Complete');
  console.log('--- Account Credentials ---');
  USERS.forEach(u => {
    console.log(`[${u.role.toUpperCase()}] Email: ${u.email} / Password: ${u.password}`);
  });
  console.log('=======================================');
}

setupE2eUser().catch(console.error);

