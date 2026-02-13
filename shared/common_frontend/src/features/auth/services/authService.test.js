import { authService } from './authService';
import { signInWithEmailAndPassword, signOut, setPersistence } from 'firebase/auth';

// Mock firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  initializeFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  setPersistence: jest.fn(),
  browserLocalPersistence: 'browserLocalPersistence',
}));

// Mock firebaseConfig to avoid initialization side effects
jest.mock('@shared/core/firebaseConfig', () => ({
  auth: { currentUser: null },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmailPassword', () => {
    it('should call setPersistence and signInWithEmailAndPassword with correct args', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUserCredential = { user: { uid: '123', email } };

      // Setup mocks
      setPersistence.mockResolvedValue();
      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      // Execute
      const result = await authService.signInWithEmailPassword(email, password);

      // Verify
      expect(setPersistence).toHaveBeenCalledTimes(1);
      // The first argument is the auth instance (mocked), checking email/password is crucial
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), email, password);
      expect(result).toEqual(mockUserCredential);
    });

    it('should throw error when signIn fails', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };

      setPersistence.mockResolvedValue();
      signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authService.signInWithEmailPassword(email, password)).rejects.toEqual(mockError);
    });
  });

  describe('signInWithPasskey', () => {
    it('should throw error as it is not implemented yet', async () => {
      await expect(authService.signInWithPasskey()).rejects.toThrow('Passkey login is under construction');
    });
  });

  describe('logout', () => {
    it('should call signOut', async () => {
      signOut.mockResolvedValue();

      await authService.logout();

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw error when signOut fails', async () => {
      const mockError = new Error('SignOut failed');
      signOut.mockRejectedValue(mockError);

      await expect(authService.logout()).rejects.toThrow('SignOut failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from auth object', () => {
      // Since we mocked auth in firebaseConfig, we can't easily update its property dynamically 
      // without more complex mocking, but we can verify it returns what's in the mock.
      // The mock defined above has currentUser: null
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});
