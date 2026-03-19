import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../features/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const ROLE_ADMIN = 'admin';
const ROLE_BY_ID_PREFIX = {
    A: 'admin',
    B: 'corporate',
    C: 'individual',
};

const resolveRoleFromUserIdPrefix = (userId) => {
    if (typeof userId !== 'string' || userId.trim().length === 0) {
        return null;
    }

    const prefix = userId.trim().charAt(0).toUpperCase();
    return ROLE_BY_ID_PREFIX[prefix] || null;
};

const extractUserIdCandidate = (data) => {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const idCandidates = [
        data.id,
        data.userId,
        data.companyId,
        data.id_company,
        data.id_individual,
    ];

    return idCandidates.find((value) => typeof value === 'string' && value.trim().length > 0) || null;
};

const resolveRoleFromFirestoreData = (data) => {
    if (!data || typeof data !== 'object') {
        return null;
    }

    if (typeof data.role === 'string' && data.role.trim().length > 0) {
        return data.role.trim();
    }

    const userIdCandidate = extractUserIdCandidate(data);
    return resolveRoleFromUserIdPrefix(userIdCandidate);
};

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
                    let userRole = idTokenResult?.claims?.role || null;

                    // Fallback: If no role in claims, check Firestore 'users' collection
                    if (!userRole) {
                        console.log('No role in claims, checking Firestore users collection...');
                        let userDocData = null;

                        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
                        if (userDocSnap.exists()) {
                            userDocData = userDocSnap.data();
                        } else {
                            const legacyUserDocSnap = await getDoc(doc(db, 'Users', currentUser.uid));
                            if (legacyUserDocSnap.exists()) {
                                userDocData = legacyUserDocSnap.data();
                            }
                        }

                        userRole = resolveRoleFromFirestoreData(userDocData);
                    }

                    setRole(userRole);
                    setIsAdmin(userRole === ROLE_ADMIN);
                } catch (e) {
                    try {
                        let userDocData = null;

                        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
                        if (userDocSnap.exists()) {
                            userDocData = userDocSnap.data();
                        } else {
                            const legacyUserDocSnap = await getDoc(doc(db, 'Users', currentUser.uid));
                            if (legacyUserDocSnap.exists()) {
                                userDocData = legacyUserDocSnap.data();
                            }
                        }

                        const userRole = resolveRoleFromFirestoreData(userDocData);
                        setRole(userRole);
                        setIsAdmin(userRole === ROLE_ADMIN);
                    } catch (firestoreError) {
                        console.error('Error fetching claims/role:', e);
                        setRole(null);
                        setIsAdmin(false);
                    }
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
