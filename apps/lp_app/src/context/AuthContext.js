import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../features/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

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
                    let userRole = idTokenResult.claims.role || null;

                    // Fallback: If no role in claims, check Firestore 'users' collection
                    if (!userRole) {
                        console.log('No role in claims, checking Firestore users collection...');
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        
                        // Try lowercase 'users' first, then Capitalized 'Users' (legacy/migration handling)
                        if (userDocSnap.exists()) {
                            userRole = userDocSnap.data().role;
                            console.log('Role found in Firestore (users):', userRole);
                        } else {
                             const legacyUserDocRef = doc(db, 'Users', currentUser.uid);
                             const legacyUserDocSnap = await getDoc(legacyUserDocRef);
                             if (legacyUserDocSnap.exists()) {
                                 userRole = legacyUserDocSnap.data().role;
                                 console.log('Role found in Firestore (Users):', userRole);
                             }
                        }
                    }

                    setRole(userRole);
                    setIsAdmin(userRole === ROLE_ADMIN);
                } catch (e) {
                    console.error('Error fetching claims/role:', e);
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
