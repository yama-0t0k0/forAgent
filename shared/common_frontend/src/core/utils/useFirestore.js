import { useState, useEffect, useCallback } from 'react';

/**
 * useFirestore - A custom hook for fetching data from Firestore.
 * 
 * @param {Function} fetchFn - A function that returns a Promise (usually from FirestoreDataService)
 * @param {Array} dependencies - Dependencies to trigger re-fetch
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFirestore = (fetchFn, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            console.error('[useFirestore] Error:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [fetchFn]);

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { data, loading, error, refetch: fetchData };
};

/**
 * useFirestoreSnapshot - A custom hook for real-time Firestore document updates.
 * 
 * @param {import('firebase/firestore').DocumentReference} docRef - The Firestore document reference
 * @returns {Object} { data, loading, error }
 */
export const useFirestoreSnapshot = (docRef) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!docRef) return;

        setLoading(true);
        const { onSnapshot } = require('firebase/firestore');

        const unsubscribe = onSnapshot(docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setData(docSnap.data());
                } else {
                    setData(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('[useFirestoreSnapshot] Error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [docRef]);

    return { data, loading, error };
};
