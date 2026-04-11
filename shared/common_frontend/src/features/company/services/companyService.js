import { 
  getFirestore, 
  doc, 
  collection, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Service for company-related operations and governance.
 */
export const CompanyService = {
  /**
   * Registers a new company and updates the user's role and permissions.
   * This is an atomic operation.
   * 
   * @param {string} uid - The user's UID.
   * @param {Object} companyData - The company information.
   * @returns {Promise<string>} The newly created company ID.
   */
  registerCompany: async (uid, companyData) => {
    const db = getFirestore();
    const companyId = `CP${Date.now()}`; // Generate a unique company ID
    const userRef = doc(db, 'users', uid);
    const companyRef = doc(db, 'companies', companyId);
    const notificationRef = doc(db, 'notifications', `${uid}_alpha_redundancy`);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check if user already has a company or is restricted
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User does not exist');
        }

        const userData = userDoc.data();
        if (userData.canCreateCompany === false) {
          throw new Error('User is not authorized to create a company or has already created one.');
        }

        if (userData.role && userData.role.startsWith('corporate-')) {
          throw new Error('User is already associated with a company.');
        }

        // 2. Create Company
        transaction.set(companyRef, {
          ...companyData,
          companyId,
          ownerUid: uid,
          createdAt: serverTimestamp(),
          alphaUids: [uid], // Track Alpha users for redundancy check
          status: 'active'
        });

        // 3. Update User Profile
        transaction.update(userRef, {
          role: 'corporate-alpha',
          companyId: companyId,
          canCreateCompany: false, // Permanently revoke creation rights
          updatedAt: serverTimestamp()
        });

        // 4. Create Redundancy Recommendation Notification
        transaction.set(notificationRef, {
          uid,
          type: 'governance',
          title: '管理者冗長化のお願い',
          message: '法人登録が完了致しました。急な退職やアカウント紛失によるロックアウトを防ぐため、2名以上の採用管理者（Alpha）を登録することを強く推奨します。',
          isRead: false,
          createdAt: serverTimestamp()
        });
      });

      console.log(`[CompanyService] Successfully registered company: ${companyId}`);
      return companyId;
    } catch (error) {
      console.error('[CompanyService] Registration failed:', error);
      throw error;
    }
  }
};
