const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// firestore.test.jsで設定されているProjectIdと同じものを使用
const PROJECT_ID = 'engineer-registration-app-yama';

describe('Firestore Security Rules E2E (Authenticated Attack Scenarios)', () => {
  let testEnv;

  beforeAll(async () => {
    // ローカルエミュレータ上のテスト環境を初期化
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 8080
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    // テスト毎にFirestoreデータをクリア
    await testEnv.clearFirestore();
    
    // ============================================
    // テスト用初期データのセットアップ（Security Rules Bypass）
    // ============================================
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // 被害者ユーザー
      await db.collection('users').doc('victim_uid').set({ role: 'individual' });
      await db.collection('private_info').doc('victim_uid').set({ 
        email: 'victim@example.com',
        allowed_companies: ['matched_company_id'] 
      });
      await db.collection('public_profile').doc('victim_uid').set({ name: 'Victim Name' });
      
      // 攻撃者企業ユーザー（マッチングしていない）
      await db.collection('users').doc('attacker_corp_uid').set({ 
        role: 'corporate', 
        companyId: 'unmatched_company_id' 
      });
      
      // マッチング成功企業ユーザー
      await db.collection('users').doc('matched_corp_uid').set({ 
        role: 'corporate', 
        companyId: 'matched_company_id' 
      });
      
      // ターゲット企業
      await db.collection('company').doc('target_company_id').set({ name: 'Target Company' });
    });
  });

  // -------------------------------------------------------------
  // 1. Unauthenticated Attacks (Guest)
  // -------------------------------------------------------------
  describe('1. Unauthenticated Attacks (Guest)', () => {
    it('should deny unauthenticated read on users collection', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('users').doc('victim_uid').get());
    });

    it('should deny unauthenticated privilege escalation', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('users').doc('hacker_uid').set({ role: 'admin' }));
    });
  });

  // -------------------------------------------------------------
  // 2. Authenticated Attacks (IDOR / Privilege Escalation)
  // -------------------------------------------------------------
  describe('2. Authenticated Attacks (IDOR / Privilege Escalation)', () => {
    it('should deny an individual user from reading another user\'s users document (IDOR)', async () => {
      const db = testEnv.authenticatedContext('attacker_uid', { role: 'individual' }).firestore();
      await assertFails(db.collection('users').doc('victim_uid').get());
    });
    
    it('should deny an individual user from reading another user\'s private_info (IDOR / Lateral Movement)', async () => {
      const db = testEnv.authenticatedContext('attacker_uid', { role: 'individual' }).firestore();
      await assertFails(db.collection('private_info').doc('victim_uid').get());
    });

    it('should deny an individual user from elevating their own privileges to admin', async () => {
      const db = testEnv.authenticatedContext('evil_user', { role: 'individual' }).firestore();
      // 自分自身のドキュメントであっても role を変更させない
      await assertFails(db.collection('users').doc('evil_user').set({ role: 'admin' }));
    });

    it('should allow an individual user to read their own private_info', async () => {
      const db = testEnv.authenticatedContext('victim_uid', { role: 'individual' }).firestore();
      await assertSucceeds(db.collection('private_info').doc('victim_uid').get());
    });
  });

  // -------------------------------------------------------------
  // 3. Business Logic Attacks (RBAC & Schemas)
  // -------------------------------------------------------------
  describe('3. Business Logic Attacks (RBAC & Schemas)', () => {
    it('should deny an unmatched corporate user from reading private_info', async () => {
      // unmatched_company_id なので allowed_companies に一致せず拒否されるべき
      const db = testEnv.authenticatedContext('attacker_corp_uid', { role: 'corporate', companyId: 'unmatched_company_id' }).firestore();
      await assertFails(db.collection('private_info').doc('victim_uid').get()); 
    });

    it('should allow a matched corporate user to read private_info', async () => {
      // matched_company_id なので allowed_companies に一致し許可されるべき
      const db = testEnv.authenticatedContext('matched_corp_uid', { role: 'corporate', companyId: 'matched_company_id' }).firestore();
      await assertSucceeds(db.collection('private_info').doc('victim_uid').get()); 
    });

    it('should deny schema bypass (non-string name inside public_profile)', async () => {
      const db = testEnv.authenticatedContext('victim_uid', { role: 'individual' }).firestore();
      await assertFails(db.collection('public_profile').doc('victim_uid').set({ name: 12345 }));
    });

    it('should deny an individual from creating a FeeMgmtAndJobStatDB record with a negative amount', async () => {
      const db = testEnv.authenticatedContext('victim_uid', { role: 'individual' }).firestore();
      await assertFails(db.collection('FeeMgmtAndJobStatDB').doc('new_fee').set({ 
        individual_ID: 'victim_uid',
        company_ID: 'target_company_id',
        amount: -100 // Validation: should be > 0
      }));
    });

    it('should deny an unauthorized user from deleting a company record', async () => {
      const db = testEnv.authenticatedContext('attacker_uid', { role: 'individual' }).firestore();
      await assertFails(db.collection('company').doc('target_company_id').delete());
    });
  });
});
