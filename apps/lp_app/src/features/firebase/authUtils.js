import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Role prefix mapping based on UID convention.
 */
const ROLE_BY_ID_PREFIX = {
  A: 'admin',
  B: 'corporate',
  C: 'individual',
};

/**
 * Resolves role from the first character of a user ID or candidate string.
 * @param {string} id - The ID to check
 * @returns {string|null} The resolved role or null
 */
export const resolveRoleFromIdPrefix = (id) => {
  if (typeof id !== 'string' || id.trim().length === 0) {
    return null;
  }
  const prefix = id.trim().charAt(0).toUpperCase();
  return ROLE_BY_ID_PREFIX[prefix] || null;
};

/**
 * Extracts a potential user/company ID from a data object.
 * @param {object} data - Firestore document data
 * @returns {string|null} Found ID or null
 */
export const extractIdCandidate = (data) => {
  if (!data || typeof data !== 'object') return null;
  const candidates = [
    data.userId,
    data.id,
    data.companyId,
    data.id_company,
    data.id_individual,
  ];
  return candidates.find(v => typeof v === 'string' && v.trim().length > 0) || null;
};

/**
 * Resolves the user's role following the prioritized sequence:
 * 1. Custom Claims (token.role)
 * 2. UID Prefix (A/B/C)
 * 3. Firestore (users/Users collection)
 * 4. Firestore (public_profile collection)
 * 
 * @param {import('firebase/auth').User} user - Firebase User object
 * @param {boolean} forceRefresh - Whether to force refresh the ID token
 * @returns {Promise<string|null>} The resolved role or null
 */
export const resolveUserRole = async (user, forceRefresh = false) => {
  if (!user) return null;

  console.log(`[AuthUtils] Resolving role for: ${user.uid} (forceRefresh: ${forceRefresh})`);

  // 1. Priority 1: Custom Claims
  try {
    const idTokenResult = await user.getIdTokenResult(forceRefresh);
    if (idTokenResult?.claims?.role) {
      console.log(`[AuthUtils] Role found in Custom Claims: ${idTokenResult.claims.role}`);
      return idTokenResult.claims.role;
    }
  } catch (e) {
    console.warn('[AuthUtils] Failed to get ID Token Result:', e);
  }

  // 2. Priority 2: UID Prefix
  const roleFromUid = resolveRoleFromIdPrefix(user.uid);
  if (roleFromUid) {
    console.log(`[AuthUtils] Role resolved from UID prefix: ${roleFromUid}`);
    return roleFromUid;
  }

  // 3. Priority 3: Firestore (users or Users)
  const collections = ['users', 'Users'];
  for (const col of collections) {
    try {
      const snap = await getDoc(doc(db, col, user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.role) {
          console.log(`[AuthUtils] Role found in Firestore (${col}): ${data.role}`);
          return data.role;
        }
        const candidate = extractIdCandidate(data);
        const resolved = resolveRoleFromIdPrefix(candidate);
        if (resolved) {
          console.log(`[AuthUtils] Role resolved from Firestore (${col}) ID candidate: ${resolved}`);
          return resolved;
        }
      }
    } catch (e) {
      console.warn(`[AuthUtils] Failed to fetch from ${col}:`, e);
    }
  }

  // 4. Priority 4: Firestore (public_profile)
  try {
    const snap = await getDoc(doc(db, 'public_profile', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      const candidate = extractIdCandidate(data);
      const resolved = resolveRoleFromIdPrefix(candidate);
      if (resolved) {
        console.log(`[AuthUtils] Role resolved from public_profile ID candidate: ${resolved}`);
        return resolved;
      }
    }
  } catch (e) {
    console.warn('[AuthUtils] Failed to fetch from public_profile:', e);
  }

  console.warn(`[AuthUtils] Could not resolve role for user: ${user.uid}`);
  return null;
};
