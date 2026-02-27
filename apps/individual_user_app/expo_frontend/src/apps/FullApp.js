import React, { useEffect, useState } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';
import { AppShell } from '@shared/src/core/components/AppShell';
import { AppNavigator } from '../navigation/AppNavigator';

const ENGINEER_TEMPLATE = require('@assets/json/engineer-profile-template.json');

/**
 * FullApp
 * The main application wrapper for individual users.
 * Manages data fetching and initialization for all integrated features.
 */
export const FullApp = () => {
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        /**
         * Loads the initial data for the application.
         */
        const load = async () => {
            try {
                // Sign in anonymously
                try {
                    const auth = getAuth();
                    await signInAnonymously(auth);
                } catch (authError) {
                    console.error('Anonymous auth failed:', authError);
                }

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Data loading timeout')), 5000)
                );

                const fetchDataPromise = FirestoreDataService.fetchIndividualAppData(
                    'C000000000000',
                    ENGINEER_TEMPLATE
                );

                const result = await Promise.race([fetchDataPromise, timeoutPromise]);

                if (mounted) {
                    setInitialData({
                        ...result.userData,
                        jd: result.jd,
                        users: result.users
                    });
                }
            } catch (e) {
                console.warn('Initialization error or timeout:', e);
                if (mounted) setInitialData({ ...ENGINEER_TEMPLATE, jd: [], users: [] });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    return (
        <AppShell isLoading={loading || !initialData}>
            <DataProvider initialData={initialData}>
                <AppNavigator />
            </DataProvider>
        </AppShell>
    );
};
