import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../features/firebase/config';

const AuthContext = createContext({
    user: null,
    isAdmin: false,
    isLoading: true,
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Check for custom claims
                const idTokenResult = await currentUser.getIdTokenResult();
                setIsAdmin(idTokenResult.claims.role === 'admin');
            } else {
                setIsAdmin(false);
            }

            setIsLoading(false);
            console.log('Auth state changed:', currentUser ? `Logged in as ${currentUser.email}` : 'Logged out');
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
