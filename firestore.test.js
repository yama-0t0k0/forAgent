const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'engineer-registration-app-yama';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    // Initialize the test environment with local Firestore emulator
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, 'firestore.rules'), 'utf8'),
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
    
    // --- Data Validation Tests ---
    it('should allow creating individual user with valid role', async () => {
        const db = testEnv.authenticatedContext('new_individual').firestore();
        await assertSucceeds(db.collection('users').doc('new_individual').set({ role: 'individual' }));
    });

    it('should allow creating corporate user with valid role and companyId', async () => {
        const db = testEnv.authenticatedContext('new_corporate').firestore();
        await assertSucceeds(db.collection('users').doc('new_corporate').set({ role: 'corporate', companyId: 'some_company' }));
    });

    it('should fail creating user with invalid role', async () => {
        const db = testEnv.authenticatedContext('hacker').firestore();
        await assertFails(db.collection('users').doc('hacker').set({ role: 'superadmin' }));
    });

    it('should fail creating corporate user without companyId', async () => {
        const db = testEnv.authenticatedContext('bad_corp').firestore();
        await assertFails(db.collection('users').doc('bad_corp').set({ role: 'corporate' }));
    });
    
    it('should fail creating user with admin role (self-promotion)', async () => {
        const db = testEnv.authenticatedContext('wannabe_admin').firestore();
        await assertFails(db.collection('users').doc('wannabe_admin').set({ role: 'admin' }));
    });
  });

  // ============================================================================
  // 1.5 Hybrid Custom Claims Tests
  // ============================================================================
  describe('Hybrid Custom Claims', () => {
    const otherUserId = 'other_user_claim';
    
    it('should allow Admin via Custom Claim (Token) even if user doc missing', async () => {
        const adminId = 'admin_user_claim';
        // Authenticated context with 'admin' role in token
        const db = testEnv.authenticatedContext(adminId, { role: 'admin' }).firestore();
        // Should be able to read any user doc (isAdmin check)
        await assertSucceeds(db.collection('users').doc(otherUserId).get());
    });

    it('should allow Admin via User Doc (Fallback) if token has no claim', async () => {
        const adminDocId = 'admin_user_doc';
        await testEnv.withSecurityRulesDisabled(async (context) => {
             await context.firestore().collection('users').doc(adminDocId).set({ role: 'admin' });
        });
        
        // Authenticated context WITHOUT specific claims (default token)
        const db = testEnv.authenticatedContext(adminDocId).firestore();
        await assertSucceeds(db.collection('users').doc(otherUserId).get());
    });

    it('should allow Corporate via Custom Claim (Token)', async () => {
        const companyId = 'corp_A';
        const corpUserId = 'corp_user_claim';
        const db = testEnv.authenticatedContext(corpUserId, { role: 'corporate', companyId: companyId }).firestore();
        
        // Should be able to write to company doc
        await assertSucceeds(db.collection('company').doc(companyId).set({ name: 'Corp A' }));
    });
    
     it('should allow Corporate via User Doc (Fallback)', async () => {
        const companyId = 'corp_B';
        const corpUserId = 'corp_user_doc';
        
        await testEnv.withSecurityRulesDisabled(async (context) => {
             await context.firestore().collection('users').doc(corpUserId).set({ role: 'corporate', companyId: companyId });
        });

        const db = testEnv.authenticatedContext(corpUserId).firestore();
        await assertSucceeds(db.collection('company').doc(companyId).set({ name: 'Corp B' }));
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

    it('should fail creating public profile with empty name', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(db.collection('public_profile').doc(userId).set({ name: '' }));
    });

    it('should fail creating public profile without name', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(db.collection('public_profile').doc(userId).set({ bio: 'Hello' }));
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

  // ============================================================================
  // 6. Selection Progress (selection_progress) Tests
  // ============================================================================
  describe('selection_progress collection', () => {
    const individualId = 'indiv_SP';
    const companyId = 'comp_SP';
    const otherId = 'other_SP';

    it('should allow individual to create their own selection progress', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        await assertSucceeds(db.collection('selection_progress').add({
            'id_individual_個人ID': individualId,
            'id_company_法人ID': companyId
        }));
    });

    it('should allow company member to create selection progress (Scout)', async () => {
        // Using Token Claim for convenience
        const db = testEnv.authenticatedContext('corp_user_SP', { role: 'corporate', companyId: companyId }).firestore();
        await assertSucceeds(db.collection('selection_progress').add({
            'id_individual_個人ID': individualId,
            'id_company_法人ID': companyId
        }));
    });

    it('should fail if unrelated user tries to create selection progress', async () => {
        const db = testEnv.authenticatedContext(otherId).firestore();
        await assertFails(db.collection('selection_progress').add({
            'id_individual_個人ID': individualId,
            'id_company_法人ID': companyId
        }));
    });
  });

  // ============================================================================
  // 7. FeeMgmtAndJobStatDB Tests
  // ============================================================================
  describe('FeeMgmtAndJobStatDB collection', () => {
    const docId = 'S202602100001';
    const individualId = 'individual_123';
    const companyId = 'company_ABC';
    const companyUserId = 'company_user_1';
    const otherUserId = 'other_user_999';
    const otherCompanyUserId = 'company_user_999';
    const adminId = 'admin_user';

    beforeEach(async () => {
      // Setup Data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        
        // Users setup
        await db.collection('users').doc(individualId).set({ role: 'individual' });
        await db.collection('users').doc(companyUserId).set({ role: 'corporate', companyId: companyId });
        await db.collection('users').doc(otherCompanyUserId).set({ role: 'corporate', companyId: 'other_company_XYZ' });
        await db.collection('users').doc(adminId).set({ role: 'admin' });

        // Existing FMJS Doc
        await db.collection('FeeMgmtAndJobStatDB').doc(docId).set({
            individual_ID: individualId,
            company_ID: companyId,
            status: 'pending'
        });
      });
    });

    it('should allow individual owner to read', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(docId).get());
    });

    it('should allow company member to read', async () => {
        const db = testEnv.authenticatedContext(companyUserId).firestore();
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(docId).get());
    });

    it('should allow admin to read', async () => {
        const db = testEnv.authenticatedContext(adminId).firestore();
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(docId).get());
    });

    it('should deny unrelated user to read', async () => {
        const db = testEnv.authenticatedContext(otherUserId).firestore();
        await assertFails(db.collection('FeeMgmtAndJobStatDB').doc(docId).get());
    });

    it('should deny unrelated company member to read', async () => {
        const db = testEnv.authenticatedContext(otherCompanyUserId).firestore();
        await assertFails(db.collection('FeeMgmtAndJobStatDB').doc(docId).get());
    });

    it('should allow individual to create own record', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        const newDocId = 'new_doc_1';
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(newDocId).set({
            individual_ID: individualId,
            company_ID: companyId
        }));
    });

    it('should deny individual to create record for others', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        const newDocId = 'new_doc_2';
        await assertFails(db.collection('FeeMgmtAndJobStatDB').doc(newDocId).set({
            individual_ID: otherUserId,
            company_ID: companyId
        }));
    });

    it('should allow company member to update status', async () => {
        const db = testEnv.authenticatedContext(companyUserId).firestore();
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(docId).update({
            status: 'interview'
        }));
    });

    it('should allow creating record with valid positive amount', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        const newDocId = 'new_doc_valid_amount';
        await assertSucceeds(db.collection('FeeMgmtAndJobStatDB').doc(newDocId).set({
            individual_ID: individualId,
            company_ID: companyId,
            amount: 1000
        }));
    });

    it('should fail creating record with negative amount', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        const newDocId = 'new_doc_negative_amount';
        await assertFails(db.collection('FeeMgmtAndJobStatDB').doc(newDocId).set({
            individual_ID: individualId,
            company_ID: companyId,
            amount: -500
        }));
    });

    it('should fail creating record with non-number amount', async () => {
        const db = testEnv.authenticatedContext(individualId).firestore();
        const newDocId = 'new_doc_string_amount';
        await assertFails(db.collection('FeeMgmtAndJobStatDB').doc(newDocId).set({
            individual_ID: individualId,
            company_ID: companyId,
            amount: "1000"
        }));
    });
  });

  describe('Company Collection Validation', () => {
    const companyId = 'comp_valid_01';
    
    it('should allow creating company with valid name', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertSucceeds(db.collection('company').doc(companyId).set({
        name: 'Valid Company Name'
      }));
    });

    it('should deny creating company without name', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertFails(db.collection('company').doc(companyId).set({
        address: 'Tokyo' // Missing name
      }));
    });

    it('should deny creating company with empty name', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertFails(db.collection('company').doc(companyId).set({
        name: ''
      }));
    });
  });

  describe('Job Description Validation (JD_Number)', () => {
    const companyId = 'comp_valid_01';
    const jdId = 'jd_01';
    
    it('should allow creating JD with all required fields', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertSucceeds(db.collection('job_description').doc(companyId).collection('JD_Number').doc(jdId).set({
        title: 'Frontend Engineer',
        description: 'React Native dev',
        salaryRange: '5M-8M JPY'
      }));
    });

    it('should deny creating JD missing title', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertFails(db.collection('job_description').doc(companyId).collection('JD_Number').doc(jdId).set({
        description: 'React Native dev',
        salaryRange: '5M-8M JPY'
      }));
    });

    it('should deny creating JD with invalid type (salaryRange as number)', async () => {
      const db = testEnv.authenticatedContext('user_corp_valid', { role: 'corporate', companyId: companyId }).firestore();
      await assertFails(db.collection('job_description').doc(companyId).collection('JD_Number').doc(jdId).set({
        title: 'Frontend Engineer',
        description: 'React Native dev',
        salaryRange: 6000000 // Number not allowed
      }));
    });
  });

  // ============================================================================
  // 8. Invitation Codes Tests (Phase 2)
  // ============================================================================
  describe('invitationCodes collection', () => {
    const validCode = 'WELCOME2026';
    const otherCode = 'OTHER_CODE';

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('invitationCodes').doc(validCode).set({
          status: 'active',
          type: 'individual',
          expiresAt: new Date(Date.now() + 86400000)
        });
      });
    });

    it('should allow anyone (even unauthenticated) to get a specific code', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(db.collection('invitationCodes').doc(validCode).get());
    });

    it('should deny listing codes (security by obscurity)', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('invitationCodes').get());
    });

    it('should deny writing to codes for normal users', async () => {
      const db = testEnv.authenticatedContext('user_123').firestore();
      await assertFails(db.collection('invitationCodes').doc(otherCode).set({ status: 'active' }));
    });

    it('should deny updating codes for normal users (even if trying to use it - should be done via Cloud Functions or Admin)', async () => {
      // Current rules only allow Admin to write. Users get error if they try direct write.
      const db = testEnv.authenticatedContext('user_123').firestore();
      await assertFails(db.collection('invitationCodes').doc(validCode).update({ status: 'used' }));
    });
  });

  // ============================================================================
  // 9. Profiles Tests (Phase 2)
  // ============================================================================
  describe('profiles collection', () => {
    const userId = 'user_abc';
    const hackerId = 'attacker_xyz';

    it('should allow owner to create/update their profile', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('profiles').doc(userId).set({
        displayName: 'Test User',
        role: 'individual'
      }));
    });

    it('should deny others from writing to profile', async () => {
      const db = testEnv.authenticatedContext(hackerId).firestore();
      await assertFails(db.collection('profiles').doc(userId).set({
        displayName: 'Hacked'
      }));
    });
  });

  // ============================================================================
  // 10. Notifications Tests (Phase 3)
  // ============================================================================
  describe('notifications collection', () => {
    const userId = 'user_notif';
    const adminId = 'admin_notif';
    const otherId = 'user_other';

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc(adminId).set({ role: 'admin' });
        await context.firestore().collection('notifications').doc('n1').set({
          uid: userId,
          message: 'Hello'
        });
      });
    });

    it('should allow user to read their own notifications', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('notifications').where('uid', '==', userId).get());
    });

    it('should deny user to read others notifications', async () => {
      const db = testEnv.authenticatedContext(otherId).firestore();
      await assertFails(db.collection('notifications').doc('n1').get());
    });

    it('should allow Admin to create notifications', async () => {
      const db = testEnv.authenticatedContext(adminId, { role: 'admin' }).firestore();
      await assertSucceeds(db.collection('notifications').add({ uid: otherId, message: 'Admin alert' }));
    });
  });

  // ============================================================================
  // 11. Registration Drafts Tests (Phase 3)
  // ============================================================================
  describe('registration_drafts collection', () => {
    const userId = 'user_draft';
    const otherId = 'user_stolen';

    it('should allow owner to read/write their own draft', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(db.collection('registration_drafts').doc(userId).set({ step: 1 }));
      await assertSucceeds(db.collection('registration_drafts').doc(userId).get());
    });

    it('should deny others to read/write a draft', async () => {
      const db = testEnv.authenticatedContext(otherId).firestore();
      await assertFails(db.collection('registration_drafts').doc(userId).get());
      await assertFails(db.collection('registration_drafts').doc(userId).set({ step: 9 }));
    });
  });
});
