/**
 * Registration Service (Phase 2: Secure Integration)
 * 
 * Handles real Firestore & Auth integration for invitation validation
 * and user enrollment.
 */
import { db, auth } from '@shared/src/core/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, runTransaction, query, where, collection, getDocs, limit } from 'firebase/firestore';

const FIRESTORE_OP_EQUALS = '=' + '=';
const INVITATION_STATUS = {
  ACTIVE: 'active',
};
const CODE_TYPE = {
  CORPORATE: 'corporate',
};
const USER_ROLE = {
  CORPORATE_ALPHA: 'corporate-alpha',
  INDIVIDUAL: 'individual',
};
const NOTIFICATION_TYPE = {
  PERMISSION_GRANTED: 'permission_granted',
};

export const VALIDATION_RULES = {
  // RFC 5322 compliant email regex
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Japanese phone number (with or without hyphens)
  // Supports 090-1234-5678, 0312345678, etc.
  phone: /^(0[5-9]0[-(]?[0-9]{4}[-)]?[0-9]{4}|0120[- representation]?[0-9]{3}[- representation]?[0-9]{3}|0[0-9]{1,4}[- representation]?[0-9]{1,4}[- representation]?[0-9]{3,4})$/,
  
  // Half-width alphabetic characters for Family/First name (English)
  latinName: /^[A-Za-z\s'-]+$/,
  
  // 6-7 digit hexadecimal or alphanumeric code
  invitationCode: /^[A-Za-z0-9]{6,7}$/,
};

/**
 * Validates the invitation code against Firestore
 *
 * @param {string} code
 * @returns {Promise<object>}
 */
export const validateInvitationCode = async (code) => {
  console.log(`[Service] Validating code: ${code}`);
  
  try {
    const docRef = doc(db, 'invitationCodes', code);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { isValid: false, errorCode: 'INVALID', message: '招待コードが見つかりません。' };
    }
    
    const data = docSnap.data();
    
    // Check status
    if (data.status !== INVITATION_STATUS.ACTIVE) {
      return { isValid: false, errorCode: 'USED', message: 'この招待コードは既に使用されているか、無効です。' };
    }
    
    // Check expiration
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return { isValid: false, errorCode: 'EXPIRED', message: '招待コードの有効期限が切れています。' };
    }
    
    return { 
      isValid: true, 
      invitationInfo: {
        code,
        type: data.type,
        issuerUid: data.issuerUid
      } 
    };
  } catch (error) {
    console.error('[Service] Error validating invitation code:', error);
    return { isValid: false, message: 'サーバーとの通信に失敗しました。' };
  }
};

/**
 * [Admin only] Creates a new invitation code in Firestore.
 *
 * @param {string} type
 * @param {number} [expiresDays]
 * @returns {Promise<object>}
 */
export const createInvitationCode = async (type, expiresDays = 7) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');

  // Generate a random 6-7 digit alphanumeric code
  const code = Math.random().toString(36).substring(2, 9).toUpperCase();
  console.log(`[Service] Creating ${type} invitation code: ${code}`);

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    const docRef = doc(db, 'invitationCodes', code);
    await setDoc(docRef, {
      code,
      type,
      issuerUid: user.uid,
      status: INVITATION_STATUS.ACTIVE,
      expiresAt: expiresAt,
      createdAt: serverTimestamp(),
    });

    return { success: true, code };
  } catch (error) {
    console.error('[Service] Error creating invitation code:', error);
    throw error;
  }
};

/**
 * [Admin only] Searches for a user by email in the private_info collection.
 * Requires a compound index on private_info.email.
 *
 * @param {string} email
 * @returns {Promise<object>}
 */
export const searchUserByEmail = async (email) => {
  console.log(`[Service] Searching user by email: ${email}`);
  try {
    const q = query(
      collection(db, 'private_info'),
      where('email', FIRESTORE_OP_EQUALS, email),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { found: false };
    }
    
    const docData = querySnapshot.docs[0].data();
    return {
      found: true,
      uid: docData.uid,
      email: docData.email
    };
  } catch (error) {
    console.error('[Service] Error searching user by email:', error);
    throw error;
  }
};

/**
 * [Admin only] Directly grants corporate registration permission to a user.
 *
 * @param {string} uid
 * @returns {Promise<object>}
 */
export const grantCorporatePermission = async (uid) => {
  console.log(`[Service] Granting corporate permission to: ${uid}`);
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      canCreateCompany: true,
      updatedAt: serverTimestamp(),
    });
    
    // Create a system notification (mock for now, could be a collection)
    const notificationRef = doc(db, 'notifications', `${uid}_corp_grant`);
    await setDoc(notificationRef, {
      uid,
      type: NOTIFICATION_TYPE.PERMISSION_GRANTED,
      message: '法人アカウントの作成権限が付与されました。マイページから登録を開始できます。',
      createdAt: serverTimestamp(),
      isRead: false
    });

    return { success: true };
  } catch (error) {
    console.error('[Service] Error granting corporate permission:', error);
    throw error;
  }
};

/**
 * Auto-saves registration progress to registration_drafts collection.
 *
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<object|undefined>}
 */
export const saveRegistrationDraft = async (uid, data) => {
  if (!uid) return;
  console.log(`[Service] Saving draft for ${uid}`);
  
  try {
    const draftRef = doc(db, 'registration_drafts', uid);
    await setDoc(draftRef, {
      uid,
      type: CODE_TYPE.CORPORATE,
      formData: data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('[Service] Error saving draft:', error);
    return { success: false };
  }
};

/**
 * Fetches existing registration draft.
 *
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export const getRegistrationDraft = async (uid) => {
  if (!uid) return null;
  try {
    const draftRef = doc(db, 'registration_drafts', uid);
    const draftSnap = await getDoc(draftRef);
    return draftSnap.exists() ? draftSnap.data() : null;
  } catch (error) {
    console.error('[Service] Error fetching draft:', error);
    return null;
  }
};

/**
 * Legacy mock auto-save (Will be phased out)
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export const autoSaveDraft = async (data) => {
  const user = auth.currentUser;
  if (user) {
    return saveRegistrationDraft(user.uid, data);
  }
  return { success: false };
};

/**
 * Finalizes user registration in Firestore after Authentication
 *
 * @param {object} registrationData
 * @param {string} codeType
 * @param {string} invitationCode
 * @returns {Promise<object>}
 */
export const registerUser = async (registrationData, codeType, invitationCode) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('認証が完了していません。再度ログインしてください。');
  }

  const uid = user.uid;
  console.log(`[Service] Registering user ${uid} as ${codeType}`);

  try {
    // 1. Prepare Public Profile (non-sensitive)
    const publicProfile = {
      uid,
      displayName: `${registrationData.family_name || ''} ${registrationData.first_name || ''}`.trim(),
      name: {
        family: registrationData.family_name || '',
        first: registrationData.first_name || ''
      },
      name_eng: {
        family: registrationData.family_name_eng || '',
        first: registrationData.first_name_eng || ''
      },
      occupation: registrationData.occupation || '',
      role: codeType || 'individual',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    // 2. Prepare Private Info (PII)
    const privateInfo = {
      uid,
      email: registrationData.email || user.email,
      phone: registrationData.phone || '',
      allowed_companies: [], // Initially empty
      updatedAt: serverTimestamp(),
    };

    // 3. Perform atomic operations via runTransaction
    await runTransaction(db, async (transaction) => {
      const profileRef = doc(db, 'profiles', uid);
      const privateInfoRef = doc(db, 'private_info', uid);
      const userRef = doc(db, 'users', uid);
      
      const finalRole = codeType === CODE_TYPE.CORPORATE ? USER_ROLE.CORPORATE_ALPHA : (codeType || USER_ROLE.INDIVIDUAL);

      // Update Public Profile
      transaction.set(profileRef, {
        ...publicProfile,
        role: finalRole
      });

      // Update Private Info
      transaction.set(privateInfoRef, privateInfo);

      // Update Users (RBAC Source)
      transaction.set(userRef, {
        uid,
        role: finalRole,
        canCreateCompany: false,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Update Invitation Code
      if (invitationCode) {
        const inviteRef = doc(db, 'invitationCodes', invitationCode);
        transaction.update(inviteRef, {
          status: 'used',
          usedBy: uid,
          usedAt: serverTimestamp(),
        });
      }
    });

    return { 
      success: true, 
      uid,
      message: '登録が完了しました。' 
    };
  } catch (error) {
    console.error('[Service] Error completing registration:', error);
    throw error;
  }
};

export default {
  VALIDATION_RULES,
  validateInvitationCode,
  createInvitationCode,
  searchUserByEmail,
  grantCorporatePermission,
  saveRegistrationDraft,
  getRegistrationDraft,
  autoSaveDraft,
  registerUser,
};
