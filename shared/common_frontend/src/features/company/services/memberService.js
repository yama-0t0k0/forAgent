import { 
  getFirestore, 
  doc, 
  runTransaction, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const FIRESTORE_OP_EQUALS = '=' + '=';

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
  },

  /**
   * Fetches all members belonging to a specific company.
   * 
   * @param {string} companyId 
   * @returns {Promise<Array>} List of member objects with uid
   */
  getCompanyMembers: async (companyId) => {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('companyId', FIRESTORE_OP_EQUALS, companyId));

    try {
      const querySnapshot = await getDocs(q);
      const members = [];
      querySnapshot.forEach((docSnap) => {
        members.push({ uid: docSnap.id, ...docSnap.data() });
      });
      return members;
    } catch (error) {
      console.error('[MemberService] Failed to fetch company members:', error);
      throw error;
    }
  },

  /**
   * General role update for non-critical roles (Beta, Gamma).
   * Note: For promotion TO Alpha, use promoteToAlpha.
   * For demotion FROM Alpha, use demoteOrRemoveAlpha.
   */
  updateRole: async (targetUid, newRole) => {
    const db = getFirestore();
    const userRef = doc(db, 'users', targetUid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('User not found');
        
        const currentRole = userDoc.data().role;
        // Safety check: Avoid using this for Alpha governance logic accidentally
        if (currentRole === 'corporate-alpha' || newRole === 'corporate-alpha') {
          throw new Error('Please use specific Alpha promotion/demotion methods for Alpha role changes.');
        }

        transaction.update(userRef, {
          role: newRole,
          updatedAt: serverTimestamp()
        });
      });
      console.log(`[MemberService] Role updated to ${newRole} for ${targetUid}`);
    } catch (error) {
      console.error('[MemberService] Role update failed:', error);
      throw error;
    }
  },

  /**
   * Transfers Alpha role from current user to a successor in a single transaction.
   * This ensures there is never a moment without an Alpha.
   */
  transferAlphaRole: async (currentAlphaUid, successorUid, companyId) => {
    const db = getFirestore();
    const companyRef = doc(db, 'companies', companyId);
    const selfRef = doc(db, 'users', currentAlphaUid);
    const successorRef = doc(db, 'users', successorUid);

    try {
      await runTransaction(db, async (transaction) => {
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists()) throw new Error('Company not found');
        
        const companyData = companyDoc.data();
        const alphas = companyData.alphaUids || [];

        // Ensure current user is actually an Alpha
        if (!alphas.includes(currentAlphaUid)) {
          throw new Error('Current user is not an Alpha.');
        }

        // Prepare new Alpha list
        let nextAlphas = alphas.filter(id => id !== currentAlphaUid);
        if (!nextAlphas.includes(successorUid)) {
          nextAlphas.push(successorUid);
        }

        // Governance check: Max 3
        if (nextAlphas.length > 3) {
          throw new Error('Ownership transfer failed: Target company already has maximum Alphas.');
        }

        // 1. Update Company Document
        transaction.update(companyRef, {
          alphaUids: nextAlphas,
          updatedAt: serverTimestamp()
        });

        // 2. Update Successor User Document
        transaction.update(successorRef, {
          role: 'corporate-alpha',
          updatedAt: serverTimestamp()
        });

        // 3. Update Self User Document (Demote to Beta)
        transaction.update(selfRef, {
          role: 'corporate-beta',
          updatedAt: serverTimestamp()
        });
      });
      console.log(`[MemberService] Alpha role transferred from ${currentAlphaUid} to ${successorUid}`);
    } catch (error) {
      console.error('[MemberService] Transfer failed:', error);
      throw error;
    }
  }
};
