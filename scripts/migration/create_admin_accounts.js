/**
 * Admin Account Provisioning Script
 * 
 * Purpose:
 * - Firebase Authentication に Admin ユーザーを作成
 * - Firestore `users/{uid}` に Admin ドキュメントを作成
 * - Custom Claims (`role: "admin"`) を付与
 * 
 * Reference: docs/security/Authentication_Authorization.md §5.3
 * 
 * 前提条件:
 * 1. npm install firebase-admin
 * 2. サービスアカウントキー(JSON)を設定:
 *    export GOOGLE_APPLICATION_CREDENTIALS='/path/to/serviceAccountKey.json'
 * 
 * 実行方法:
 * node scripts/migration/create_admin_accounts.js
 * 
 * ⚠️ パスワードは初回ログイン後に必ず変更してください。
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } else {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
    }
} catch (e) {
    console.error('❌ Firebase Admin 初期化失敗');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS=\'/path/to/serviceAccountKey.json\'');
    process.exit(1);
}

const db = admin.firestore();
const authAdmin = admin.auth();

// ==========================================
// Admin Account Definitions
// ==========================================
const ADMIN_ACCOUNTS = [
    {
        adminId: 'a000',
        email: 'm.yamakawa@lat-inc.com',
        password: 'LatAdmin2026!',   // ⚠️ 初回ログイン後に要変更
        displayName: 'M. Yamakawa',
        description: '主管理者'
    },
    {
        adminId: 'a001',
        email: 't.sameshima@lat-inc.com',
        password: 'LatAdmin2026!',   // ⚠️ 初回ログイン後に要変更
        displayName: 'T. Sameshima',
        description: '副管理者'
    }
];

/**
 * Create a single Admin account
 */
async function createAdminAccount(accountDef) {
    const { adminId, email, password, displayName, description } = accountDef;
    console.log(`\n--- Creating: ${adminId} / ${email} (${description}) ---`);

    try {
        // 1. Check if Auth account already exists
        let userRecord;
        try {
            userRecord = await authAdmin.getUserByEmail(email);
            console.log(`  ⚠️  Auth account already exists: UID=${userRecord.uid}`);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                // 2. Create Firebase Auth account
                userRecord = await authAdmin.createUser({
                    email,
                    password,
                    displayName,
                    disabled: false
                });
                console.log(`  ✅ Auth account created: UID=${userRecord.uid}`);
            } else {
                throw err;
            }
        }

        const uid = userRecord.uid;

        // 3. Set Custom Claims
        await authAdmin.setCustomUserClaims(uid, { role: 'admin' });
        console.log(`  ✅ Custom Claims set: { role: "admin" }`);

        // 4. Create Firestore users/{uid} document
        const userDocRef = db.collection('users').doc(uid);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists) {
            // Update existing doc
            await userDocRef.set({
                role: 'admin',
                adminId,
                companyId: null,
                email,
                displayName,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`  ✅ Firestore users/${uid} updated (existing doc)`);
        } else {
            // Create new doc
            await userDocRef.set({
                role: 'admin',
                adminId,
                companyId: null,
                email,
                displayName,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`  ✅ Firestore users/${uid} created`);
        }

        return { adminId, email, uid, status: 'success' };

    } catch (error) {
        console.error(`  ❌ Failed for ${email}:`, error.message);
        return { email, uid: null, status: 'failed', error: error.message };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('==================================================');
    console.log('Admin Account Provisioning');
    console.log('==================================================');

    const results = [];
    for (const account of ADMIN_ACCOUNTS) {
        const result = await createAdminAccount(account);
        results.push(result);
    }

    console.log('\n==================================================');
    console.log('Summary:');
    console.log('==================================================');
    for (const r of results) {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`  ${icon} ${r.adminId} / ${r.email} -> UID: ${r.uid || 'N/A'}`);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\nTotal: ${successCount}/${results.length} accounts provisioned.`);
    console.log('\n⚠️  初回ログイン後にパスワードを変更してください。');
}

main().catch(console.error);
