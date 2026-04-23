const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'demo-project' });
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
      await db.collection('users').doc('A999').set({
        role: 'admin',
        companyId: null,
        email: 'e2e-test-A999@lat-inc.com',
        displayName: 'E2E Admin Tester',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  },
  {
    uid: 'B00001',
    email: 'e2e-test-B00001@lat-inc.com',
    password: 'E2ePassword2026!',
    role: 'corporate',
    displayName: 'E2E Corporate Tester',
    companyId: 'B00001', 
    setupData: async (db) => {
      await db.collection('users').doc('B00001').set({
        role: 'corporate',
        companyId: 'B00001',
        email: 'e2e-test-B00001@lat-inc.com',
        displayName: 'E2E Corporate Tester',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  },
  {
    uid: 'C000000000001',
    email: 'e2e-test-C000000000001@lat-inc.com',
    password: 'password', // E2Eテスト用に簡単化（Golden Pathと統一）
    role: 'individual',
    displayName: 'E2E Test User',
    companyId: null,
    setupData: async (db) => {
      const UID = 'C000000000001';
      await db.collection('users').doc(UID).set({
        role: 'individual',
        companyId: null,
        email: 'e2e-test-C000000000001@lat-inc.com',
        displayName: 'E2E Test User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

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
    }
  }
];

async function seed() {
  console.log("🌱 Seeding E2E Users into Firestore & Auth Emulator...");

  for (const user of USERS) {
    try {
      try {
        await authAdmin.getUser(user.uid);
        await authAdmin.updateUser(user.uid, { password: user.password, email: user.email, displayName: user.displayName });
      } catch (authErr) {
        if (authErr.code === 'auth/user-not-found') {
          await authAdmin.createUser({
            uid: user.uid,
            email: user.email,
            password: user.password,
            displayName: user.displayName,
            disabled: false
          });
        } else {
          throw authErr;
        }
      }
      
      const claims = { role: user.role };
      if (user.companyId) {
        claims.companyId = user.companyId;
      }
      await authAdmin.setCustomUserClaims(user.uid, claims);
    } catch (err) {
      console.error(`[Auth] Error for ${user.uid}: ${err.message}`);
      process.exit(1);
    }

    try {
      await user.setupData(db);
    } catch (err) {
      console.error(`[Firestore] Error for ${user.uid}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log("✅ Seed completed successfully!");
}

seed().catch(e => {
  console.error("❌ Seeding failed", e);
  process.exit(1);
});
