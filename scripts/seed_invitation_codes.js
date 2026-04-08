/**
 * scripts/seed_invitation_codes.js
 * 
 * 招待制新規登録フローのテスト用データを投入するスクリプト。
 * 開発環境 (Emulator) または本番環境の Firestore に招待コードを生成します。
 */

const admin = require('firebase-admin');

// エミュレータを優先的に使用する設定
if (process.env.USE_PROD !== 'true') {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    console.log('Using Firestore Emulator (127.0.0.1:8080)');
} else {
    console.log('WARNING: Operating on PRODUCTION Firestore!');
}

// プロジェクトIDの設定
admin.initializeApp({
    projectId: 'flutter-frontend-21d0a'
});

const db = admin.firestore();

const testCodes = [
    {
        code: 'INVITE2024',
        type: 'individual',
        issuerUid: 'SYSTEM',
        status: 'active',
        expiresAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
        description: '個人ユーザー用テストコード(2024)'
    },
    {
        code: 'CORP123',
        type: 'corporate',
        issuerUid: 'SYSTEM',
        status: 'active',
        expiresAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
        description: '法人ユーザー用テストコード'
    },
    {
        code: 'EXPIRED00',
        type: 'individual',
        issuerUid: 'SYSTEM',
        status: 'active',
        expiresAt: admin.firestore.Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')),
        description: '期限切れコード'
    },
    {
        code: 'USED777',
        type: 'individual',
        issuerUid: 'SYSTEM',
        status: 'used',
        expiresAt: admin.firestore.Timestamp.fromDate(new Date('2025-12-31T23:59:59Z')),
        description: '使用済みコード'
    }
];

async function seed() {
    console.log('\n--- Seeding invitationCodes ---');
    
    for (const data of testCodes) {
        const { code, ...rest } = data;
        await db.collection('invitationCodes').doc(code).set({
            ...rest,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Seeded: ${code} (Type: ${data.type}, Status: ${data.status})`);
    }
    
    console.log('\n--- Seed complete ---\n');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
