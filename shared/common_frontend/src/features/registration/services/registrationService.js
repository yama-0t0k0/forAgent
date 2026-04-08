/**
 * Registration Service (Phase 2: Secure Integration)
 * 
 * Handles real Firestore & Auth integration for invitation validation
 * and user enrollment.
 */
import { db, auth } from '@shared/src/core/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

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
 */
export const validateInvitationCode = async (code) => {
  console.log(`[Service] Validating code: ${code}`);
  
  try {
    const docRef = doc(db, 'invitationCodes', code);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { isValid: false, message: '招待コードが見つかりません。' };
    }
    
    const data = docSnap.data();
    
    // Check status
    if (data.status !== 'active') {
      return { isValid: false, message: 'この招待コードは既に使用されているか、無効です。' };
    }
    
    // Check expiration
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return { isValid: false, message: '招待コードの有効期限が切れています。' };
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
 * Simulates auto-saving registration progress
 */
export const autoSaveDraft = async (data) => {
  console.log('[Mock API] Auto-saving progress:', data);
  
  // In a real app, this would save to a temporary Firestore doc or LocalStorage
  // For Phase 1, we just return success.
  return { success: true, timestamp: new Date().toISOString() };
};

/**
 * Finalizes user registration in Firestore after Authentication
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
      
      transaction.set(profileRef, publicProfile);
      transaction.set(privateInfoRef, privateInfo);

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
  autoSaveDraft,
  registerUser,
};
