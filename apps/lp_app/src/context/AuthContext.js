import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../features/firebase/config';

const ROLE_ADMIN = 'admin';

const AuthContext = createContext({
    user: null,
    isAdmin: false,
    role: null, // 'admin' | 'corporate' | 'individual'
    isLoading: true,
});

/**
 * Auth Provider Component
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element} Auth Provider
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Check for custom claims
                try {
                    const idTokenResult = await currentUser.getIdTokenResult();
                    const userRole = idTokenResult.claims.role || null;
                    setRole(userRole);
                    setIsAdmin(userRole === ROLE_ADMIN);
                } catch (e) {
                    console.error('Error fetching claims:', e);
                    setRole(null);
                    setIsAdmin(false);
                }
            } else {
                setRole(null);
                setIsAdmin(false);
            }

            setIsLoading(false);
            console.log('Auth state changed:', currentUser ? `Logged in as ${currentUser.email}` : 'Logged out');
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, role, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
