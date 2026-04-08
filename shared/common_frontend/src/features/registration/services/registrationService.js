/**
 * Registration Service (Mock for Phase 1)
 * 
 * Includes validation rules, invitation code verification, 
 * auto-save simulation, and registration mocks.
 */

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
 * Validates the invitation code (Mock logic)
 */
export const validateInvitationCode = async (code) => {
  console.log(`[Mock API] Validating code: ${code}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock valid codes:
  // '111111' -> Individual
  // '999999' -> Corporate
  if (code === '111111') {
    return { valid: true, type: 'individual' };
  } else if (code === '999999') {
    return { valid: true, type: 'corporate' };
  }
  
  return { valid: false, message: '招待コードが無効または期限切れです。' };
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
 * Mocks user registration step
 */
export const registerUser = async (registrationData, codeType) => {
  console.log(`[Mock API] Registering user as ${codeType}:`, registrationData);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { 
    success: true, 
    uid: 'mock-user-uid-' + Math.random().toString(36).substr(2, 9),
    message: '登録が完了しました。' 
  };
};

export default {
  VALIDATION_RULES,
  validateInvitationCode,
  autoSaveDraft,
  registerUser,
};
