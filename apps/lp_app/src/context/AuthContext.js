import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../features/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const ROLE_ADMIN = 'admin';
const TYPEOF_STRING = 'string';
const TYPEOF_OBJECT = 'object';
const ROLE_BY_ID_PREFIX = {
    A: 'admin',
    B: 'corporate',
    C: 'individual',
};

/**
 * @param {string|null|undefined} userId
 * @returns {string|null}
 */
const resolveRoleFromUserIdPrefix = (userId) => {
    if (typeof userId !== TYPEOF_STRING || userId.trim().length === 0) {
        return null;
    }

    const prefix = userId.trim().charAt(0).toUpperCase();
    return ROLE_BY_ID_PREFIX[prefix] || null;
};

/**
 * @param {object|null|undefined} data
 * @returns {string|null}
 */
const extractUserIdCandidate = (data) => {
    if (!data || typeof data !== TYPEOF_OBJECT) {
        return null;
    }

    const idCandidates = [
        data.id,
        data.userId,
        data.companyId,
        data.id_company,
        data.id_individual,
    ];

    return idCandidates.find((value) => typeof value === TYPEOF_STRING && value.trim().length > 0) || null;
};

/**
 * @param {object|null|undefined} data
 * @returns {string|null}
 */
const resolveRoleFromFirestoreData = (data) => {
    if (!data || typeof data !== TYPEOF_OBJECT) {
        return null;
    }

    if (typeof data.role === TYPEOF_STRING && data.role.trim().length > 0) {
        return data.role.trim();
    }

    const userIdCandidate = extractUserIdCandidate(data);
    return resolveRoleFromUserIdPrefix(userIdCandidate);
};

const AuthContext = createContext({
    user: null,
    isAdmin: false,
    role: null, // 'admin' | 'corporate' | 'individual'
    needsAdminRepair: false,
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
    const [needsAdminRepair, setNeedsAdminRepair] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('🔄 [AuthContext] onAuthStateChanged started', { uid: currentUser?.uid });
            setUser(currentUser);

            if (currentUser) {
                const roleFromUidPrefix = resolveRoleFromUserIdPrefix(currentUser.uid);
                console.log('🔄 [AuthContext] Role from UID prefix:', roleFromUidPrefix);
                let roleFromToken = null;
                let roleFromFirestore = null;
                let tokenError = null;
                let firestoreError = null;

                try {
                    console.log('🔄 [AuthContext] Fetching ID token results...');
                    const idTokenResult = await currentUser.getIdTokenResult(true);
                    roleFromToken = idTokenResult?.claims?.role || null;
                    console.log('🔄 [AuthContext] Role from token claims:', roleFromToken);
                } catch (e) {
                    tokenError = e;
                    console.error('❌ [AuthContext] ID Token Result error:', e);
                }

                if (!roleFromToken) {
                    try {
                        console.log('🔄 [AuthContext] Fetching user doc from Firestore...');
                        let userDocData = null;

                        const userDocSnap = await getDoc(doc(db, 'users', currentUser.uid));
                        if (userDocSnap.exists()) {
                            userDocData = userDocSnap.data();
                        } else {
                            console.log('🔄 [AuthContext] Doc not found in users/, checking Users/ (legacy)...');
                            const legacyUserDocSnap = await getDoc(doc(db, 'Users', currentUser.uid));
                            if (legacyUserDocSnap.exists()) {
                                userDocData = legacyUserDocSnap.data();
                            }
                        }

                        roleFromFirestore = resolveRoleFromFirestoreData(userDocData);
                        console.log('🔄 [AuthContext] Role from Firestore data:', roleFromFirestore);
                    } catch (e) {
                        firestoreError = e;
                        console.error('❌ [AuthContext] Firestore error:', e);
                    }
                }

                const resolvedRole = roleFromToken || roleFromFirestore || roleFromUidPrefix;
                const adminVerified = roleFromToken === ROLE_ADMIN || roleFromFirestore === ROLE_ADMIN;

                console.log('✅ [AuthContext] Final Resolved Role:', resolvedRole);
                setRole(resolvedRole);
                setIsAdmin(resolvedRole === ROLE_ADMIN);
                setNeedsAdminRepair(roleFromUidPrefix === ROLE_ADMIN && !adminVerified);

                if (!resolvedRole && (tokenError || firestoreError)) {
                    const tokenErrorCode = typeof tokenError?.code === TYPEOF_STRING ? tokenError.code : null;
                    const tokenErrorMessage = typeof tokenError?.message === TYPEOF_STRING ? tokenError.message : null;
                    const firestoreErrorCode = typeof firestoreError?.code === TYPEOF_STRING ? firestoreError.code : null;
                    const firestoreErrorMessage = typeof firestoreError?.message === TYPEOF_STRING ? firestoreError.message : null;

                    console.warn('⚠️ [AuthContext] Failed to resolve role', {
                        uid: currentUser.uid,
                        tokenErrorCode,
                        tokenErrorMessage,
                        firestoreErrorCode,
                        firestoreErrorMessage,
                    });
                }
            } else {
                console.log('👤 [AuthContext] No user logged in.');
                setRole(null);
                setIsAdmin(false);
                setNeedsAdminRepair(false);
            }

            setIsLoading(false);
            console.log('🏁 [AuthContext] Auth state change complete. isLoading=false');
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin, role, needsAdminRepair, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
