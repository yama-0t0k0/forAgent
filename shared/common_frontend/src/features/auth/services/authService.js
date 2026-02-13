import { signInWithEmailAndPassword, signOut, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { auth } from '@shared/src/core/firebaseConfig';

/**
 * Authentication Service
 * Wraps Firebase Auth methods for use in the application.
 */
export const authService = {
  /**
   * Sign in with Email and Password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<UserCredential>}
   */
  async signInWithEmailPassword(email, password) {
    try {
      // Ensure persistence is set (defaults to 'local' in web, but good to be explicit)
      // Note: setPersistence might not be needed for React Native if initialized correctly,
      // but for Web (Admin App), browserLocalPersistence is standard.
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Login Error:', error.code, error.message);
      throw error;
    }
  },

  /**
   * Sign in with Passkey (WebAuthn)
   * Note: This is a placeholder for Phase 1.1. 
   * Actual WebAuthn implementation requires domain association and specific browser support.
   */
  async signInWithPasskey() {
    // TODO: Implement actual WebAuthn logic using firebase.auth.WebAuthnCredentials
    console.warn('Passkey login is not yet fully implemented.');
    throw new Error('Passkey login is under construction. Please use password login.');
  },

  /**
   * Sign out the current user
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  },

  /**
   * Get current user
   * @returns {User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  }
};
