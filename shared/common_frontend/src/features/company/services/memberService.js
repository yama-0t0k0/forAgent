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
import { NotificationService } from '../../notification/services/notificationService';
import { SYSTEM_USER_ID } from '../../../core/constants';

const FIRESTORE_OP_EQUALS = '=' + '=';

/**
 * @file MemberService.js
 * @description Service for managing company members and roles with governance rules.
 */

/**
 * @readonly
 * @enum {string}
 */
const USER_ROLE = {
  CORPORATE_ALPHA: 'corporate-alpha',
  CORPORATE_BETA: 'corporate-beta',
  CORPORATE_GAMMA: 'corporate-gamma',
  INDIVIDUAL: 'individual',
};

/**
 * @readonly
 * @enum {string}
 */
const NOTIFICATION_TYPE = {
  ROLE_CHANGED: 'role_changed',
  ROLE_TRANSFERRED: 'role_transferred',
};

const MAX_ALPHA_COUNT = 3;
const MIN_ALPHA_COUNT = 1;

export const MemberService = {
  /**
   * Promotes a user to the Alpha (Recruitment Manager) role.
   * Enforces the 3-person limit per company.
   * 
   * @param {string} targetUid - The user ID to promote.
   * @param {string} companyId - The company ID.
   * @param {string} performerName - The name of the user performing the promotion.
   */
  promoteToAlpha: async (targetUid, companyId, performerName) => {
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
        if (currentAlphas.length >= MAX_ALPHA_COUNT) {
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

        transaction.update(targetUserRef, {
          role: USER_ROLE.CORPORATE_ALPHA,
          updatedAt: serverTimestamp()
        });

        const targetUserData = (await transaction.get(targetUserRef)).data();
        const targetName = targetUserData?.displayName || '新しいメンバー';

        // 4. Create Notifications (Target + All Alphas)
        const notifyUids = [...new Set([...currentAlphas, targetUid])];
        notifyUids.forEach((uid) => {
          const isTarget = uid === targetUid;
          NotificationService.createNotificationInTransaction(transaction, {
            uid: uid,
            type: NOTIFICATION_TYPE.ROLE_CHANGED,
            title: 'Alpha 権限への昇格',
            message: isTarget 
              ? `${performerName} さんによって、あなたは Alpha 権限に昇格しました。`
              : `${performerName} さんによって、${targetName} さんが Alpha 権限に昇格しました。`,
            metadata: { companyId, targetUid, role: USER_ROLE.CORPORATE_ALPHA }
          });
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
   * @param {string} performerName - The name of the user performing the action.
   * @param {string} newRole - The target role (null if removing from company).
   */
  demoteOrRemoveAlpha: async (
    targetUid,
    companyId,
    performerName,
    newRole = USER_ROLE.CORPORATE_BETA
  ) => {
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
        if (currentAlphas.includes(targetUid) && currentAlphas.length <= MIN_ALPHA_COUNT) {
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
            role: USER_ROLE.INDIVIDUAL,
            companyId: null,
            updatedAt: serverTimestamp()
          });
        }

        const targetUserData = (await transaction.get(targetUserRef)).data();
        const targetName = targetUserData?.displayName || 'メンバー';

        // 4. Create Notifications (Target + Remaining Alphas)
        const remainingAlphas = currentAlphas.filter(id => id !== targetUid);
        const notifyUids = [...new Set([...remainingAlphas, targetUid])];
        
        notifyUids.forEach((uid) => {
          const isTarget = uid === targetUid;
          const actionText = newRole ? `ロール変更（${newRole}）` : '法人からの脱退';
          NotificationService.createNotificationInTransaction(transaction, {
            uid: uid,
            type: NOTIFICATION_TYPE.ROLE_CHANGED,
            title: '権限変更の通知',
            message: isTarget
              ? `${performerName} さんによって、あなたの権限が変更されました。`
              : `${performerName} さんによって、${targetName} さんの権限が変更されました。`,
            metadata: { companyId, targetUid, role: newRole || USER_ROLE.INDIVIDUAL }
          });
        });
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
        if (currentRole === USER_ROLE.CORPORATE_ALPHA || newRole === USER_ROLE.CORPORATE_ALPHA) {
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
   * 
   * @param {string} currentAlphaUid 
   * @param {string} successorUid 
   * @param {string} companyId 
   * @param {string} performerName 
   */
  transferAlphaRole: async (currentAlphaUid, successorUid, companyId, performerName) => {
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
        if (nextAlphas.length > MAX_ALPHA_COUNT) {
          throw new Error('Ownership transfer failed: Target company already has maximum Alphas.');
        }

        // 1. Update Company Document
        transaction.update(companyRef, {
          alphaUids: nextAlphas,
          updatedAt: serverTimestamp()
        });

        // 2. Update Successor User Document
        transaction.update(successorRef, {
          role: USER_ROLE.CORPORATE_ALPHA,
          updatedAt: serverTimestamp()
        });

        transaction.update(selfRef, {
          role: USER_ROLE.CORPORATE_BETA,
          updatedAt: serverTimestamp()
        });

        const successorData = (await transaction.get(successorRef)).data();
        const successorName = successorData?.displayName || '新しい管理者';

        // 4. Create Notifications (Predecessor, Successor, and other Alphas)
        const otherAlphas = alphas.filter(id => id !== currentAlphaUid && id !== successorUid);
        const notifyUids = [...new Set([currentAlphaUid, successorUid, ...otherAlphas])];

        notifyUids.forEach((uid) => {
          let msg = '';
          if (uid === successorUid) {
            msg = `${performerName} さんから Alpha 権限（管理者）を引き継ぎました。`;
          } else if (uid === currentAlphaUid) {
            msg = `${successorName} さんへ Alpha 権限を引き継ぎました。`;
          } else {
            msg = `${performerName} さんから ${successorName} さんへ Alpha 権限が引き継がれました。`;
          }

          NotificationService.createNotificationInTransaction(transaction, {
            uid: uid,
            type: NOTIFICATION_TYPE.ROLE_TRANSFERRED,
            title: '管理者権限の引き継ぎ',
            message: msg,
            metadata: { companyId, fromUid: currentAlphaUid, toUid: successorUid }
          });
        });
      });
      console.log(`[MemberService] Alpha role transferred from ${currentAlphaUid} to ${successorUid}`);
    } catch (error) {
      console.error('[MemberService] Transfer failed:', error);
      throw error;
    }
  }
};
