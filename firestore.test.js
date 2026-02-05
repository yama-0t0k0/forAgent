const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

const PROJECT_ID = 'engineer-registration-app-yama';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    // Initialize the test environment with local Firestore emulator
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // ============================================================================
  // 1. users Collection Tests
  // ============================================================================
  describe('users collection', () => {
    const userId = 'user_123';
    const otherUserId = 'user_456';
    const adminId = 'admin_user';

    it('should allow user to read their own document', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('users').doc(userId).get());
    });

    it('should deny user to read other user document', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(db.collection('users').doc(otherUserId).get());
    });

    it('should allow admin to read any user document', async () => {
      // Simulate admin by setting role in users collection (requires setup)
      // For simplicity in rules, isAdmin() checks role field.
      // We need to setup admin user data first using rules bypass or admin SDK if possible.
      // Here we assume authenticatedContext can mock token claims if rules used claims.
      // But rules use get() on users collection. So we must write data first.
      
      // Since we can't easily write as admin without admin rights in rules test env (unless usingRules(false)),
      // we'll skip complex admin setup for this basic test or assume rules bypass for setup.
      
      // Setup Admin User (Bypassing rules for setup)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(adminId).set({ role: 'admin' });
      });

      const db = testEnv.authenticatedContext(adminId).firestore();
      await assertSucceeds(db.collection('users').doc(otherUserId).get());
    });
  });

  // ============================================================================
  // 2. public_profile Tests
  // ============================================================================
  describe('public_profile collection', () => {
    const userId = 'user_123';
    
    it('should allow anyone to read public profile', async () => {
      const db = testEnv.authenticatedContext('any_user').firestore();
      await assertSucceeds(db.collection('public_profile').doc(userId).get());
    });

    it('should allow owner to write public profile', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('public_profile').doc(userId).set({ name: 'Public Name' }));
    });

    it('should deny others to write public profile', async () => {
      const db = testEnv.authenticatedContext('other_user').firestore();
      await assertFails(db.collection('public_profile').doc(userId).set({ name: 'Hacked' }));
    });
  });

  // ============================================================================
  // 3. private_info Tests (Crucial for Security Refactoring)
  // ============================================================================
  describe('private_info collection', () => {
    const userId = 'individual_123';
    const companyId = 'company_ABC';
    const companyUserId = 'company_user_1';
    const otherCompanyUserId = 'company_user_2';

    beforeEach(async () => {
      // Setup Data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        // Target Individual User
        await context.firestore().collection('users').doc(userId).set({ role: 'individual' });
        
        // Private Info with Allowed Companies
        await context.firestore().collection('private_info').doc(userId).set({
            email: 'private@example.com',
            allowed_companies: [companyId] // Matched with company_ABC
        });

        // Matched Company User
        await context.firestore().collection('users').doc(companyUserId).set({
            role: 'corporate',
            companyId: companyId
        });

        // Unmatched Company User
        await context.firestore().collection('users').doc(otherCompanyUserId).set({
            role: 'corporate',
            companyId: 'other_company_XYZ'
        });
      });
    });

    it('should allow owner to read private info', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('private_info').doc(userId).get());
    });

    it('should deny unrelated user to read private info', async () => {
      const db = testEnv.authenticatedContext('random_user').firestore();
      await assertFails(db.collection('private_info').doc(userId).get());
    });

    it('should allow MATCHED company user to read private info', async () => {
      const db = testEnv.authenticatedContext(companyUserId).firestore();
      await assertSucceeds(db.collection('private_info').doc(userId).get());
    });

    it('should deny UNMATCHED company user to read private info', async () => {
      const db = testEnv.authenticatedContext(otherCompanyUserId).firestore();
      await assertFails(db.collection('private_info').doc(userId).get());
    });
  });
});
