import { 
  getFirestore, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Service for managing company members and roles with governance rules.
 */
export const MemberService = {
  /**
   * Promotes a user to the Alpha (Recruitment Manager) role.
   * Enforces the 3-person limit per company.
   * 
   * @param {string} targetUid - The user ID to promote.
   * @param {string} companyId - The company ID.
   */
  promoteToAlpha: async (targetUid, companyId) => {
    const db = getFirestore();
    const companyRef = doc(db, 'companies', companyId);
    const targetUserRef = doc(db, 'users', targetUid);

    try {
      await runTransaction(db, async (transaction) => {
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists()) throw new Error('Company not found');

        const companyData = companyDoc.data();
        const currentAlphas = companyData.alphaUids || [];

        // 1. Enforce Max 3 Alphas
        if (currentAlphas.length >= 3) {
          throw new Error('A company can have a maximum of 3 Alpha (Recruitment Manager) users.');
        }

        if (currentAlphas.includes(targetUid)) {
          throw new Error('User is already an Alpha.');
        }

        // 2. Update Company's Alpha List
        transaction.update(companyRef, {
          alphaUids: [...currentAlphas, targetUid],
          updatedAt: serverTimestamp()
        });

        // 3. Update User's Role
        transaction.update(targetUserRef, {
          role: 'corporate-alpha',
          updatedAt: serverTimestamp()
        });
      });
      console.log(`[MemberService] Successfully promoted ${targetUid} to Alpha in ${companyId}`);
    } catch (error) {
      console.error('[MemberService] Promotion failed:', error);
      throw error;
    }
  },

  /**
   * Demotes a user from Alpha to another role or removes them.
   * Enforces the "Last Alpha" protection (Min 1 Alpha).
   * 
   * @param {string} targetUid - The user ID to demote/remove.
   * @param {string} companyId - The company ID.
   * @param {string} newRole - The target role (null if removing from company).
   */
  demoteOrRemoveAlpha: async (targetUid, companyId, newRole = 'corporate-beta') => {
    const db = getFirestore();
    const companyRef = doc(db, 'companies', companyId);
    const targetUserRef = doc(db, 'users', targetUid);

    try {
      await runTransaction(db, async (transaction) => {
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists()) throw new Error('Company not found');

        const companyData = companyDoc.data();
        const currentAlphas = companyData.alphaUids || [];

        // 1. Enforce Min 1 Alpha (Last Person Protection)
        if (currentAlphas.includes(targetUid) && currentAlphas.length <= 1) {
          throw new Error('Cannot remove the last Alpha user. Please designate a successor first.');
        }

        // 2. Update Company's Alpha List
        if (currentAlphas.includes(targetUid)) {
          transaction.update(companyRef, {
            alphaUids: currentAlphas.filter(id => id !== targetUid),
            updatedAt: serverTimestamp()
          });
        }

        // 3. Update User's Role/Association
        if (newRole) {
          transaction.update(targetUserRef, {
            role: newRole,
            updatedAt: serverTimestamp()
          });
        } else {
          // Complete removal from company
          transaction.update(targetUserRef, {
            role: 'individual',
            companyId: null,
            updatedAt: serverTimestamp()
          });
        }
      });
      console.log(`[MemberService] Successfully processed alpha demotion/removal for ${targetUid}`);
    } catch (error) {
      console.error('[MemberService] Alpha change failed:', error);
      throw error;
    }
  }
};
