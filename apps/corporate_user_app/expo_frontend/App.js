import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { getAuth, signInAnonymously } from "firebase/auth";
import { FirestoreDataService } from '@shared/src/core/services/FirestoreDataService';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { CompanyPageScreen } from './src/features/company_profile/CompanyPageScreen';
import { CorporateMenuScreen } from '@shared/src/features/profile/CorporateMenuScreen';
import { CorporateImageEditScreen } from '@shared/src/features/profile/CorporateImageEditScreen';
import { TechStackScreen } from './src/features/company_profile/TechStackScreen';
import { UnderConstructionScreen } from './src/features/company_profile/UnderConstructionScreen';
import { CorporateBottomNav } from '@shared/src/core/components/CorporateBottomNav';
import { AppShell } from '@shared/src/core/components/AppShell';
import { ROUTES } from '@shared/src/core/constants/navigation';

const COMPANY_TEMPLATE = require('./assets/json/company-profile-template.json');
const Stack = createNativeStackNavigator();

/**
 * Wrapper component for the Corporate Registration feature.
 * Manages data fetching and navigation.
 * @returns {JSX.Element} The rendered component.
 */
const CorporateRegistrationWrapper = () => {
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Fetches company data using FirestoreDataService.
         * Falls back to a template if the document doesn't exist or an error occurs.
         */
        const fetchData = async () => {
            try {
                // Sign in anonymously to allow access to secured APIs (Cloud Run)
                try {
                    const auth = getAuth();
                    await signInAnonymously(auth);
                    console.log("Signed in anonymously (Corporate App)");
                } catch (authError) {
                    console.error("Anonymous auth failed:", authError);
                }

                const data = await FirestoreDataService.fetchCorporateAppData('B00000', COMPANY_TEMPLATE);
                setInitialData(data);
            } catch (error) {
                console.error("Error fetching document:", error);
                setInitialData(COMPANY_TEMPLATE);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <AppShell isLoading={loading}>
            <DataProvider initialData={initialData}>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={ROUTES.CORPORATE_PAGE}>
                    <Stack.Screen name={ROUTES.CORPORATE_PAGE} component={CompanyPageScreen} />
                    <Stack.Screen name={ROUTES.CORPORATE_TECH_STACK} component={TechStackScreen} />
                    <Stack.Screen name={ROUTES.CORPORATE_JOBS} component={UnderConstructionScreen} initialParams={{ title: '求人' }} />
                    <Stack.Screen name={ROUTES.CORPORATE_CONNECTIONS} component={UnderConstructionScreen} initialParams={{ title: 'つながり' }} />
                    <Stack.Screen name={ROUTES.CORPORATE_BLOG} component={UnderConstructionScreen} initialParams={{ title: 'ブログ' }} />
                    <Stack.Screen name={ROUTES.CORPORATE_EVENTS} component={UnderConstructionScreen} initialParams={{ title: 'イベント' }} />
                    <Stack.Screen name={ROUTES.MENU} component={CorporateMenuScreen} />
                    <Stack.Screen name={ROUTES.IMAGE_EDIT} component={CorporateImageEditScreen} />
                    <Stack.Screen name={ROUTES.REGISTRATION}>
                        {(props) => (
                            <GenericRegistrationScreen
                                {...props}
                                title="企業プロフィール登録"
                                collectionName="company"
                                idField="id"
                                idPrefixChar="B"
                                homeRouteName={ROUTES.CORPORATE_PAGE}
                                BottomNavComponent={CorporateBottomNav}
                            />
                        )}
                    </Stack.Screen>
                </Stack.Navigator>
            </DataProvider>
        </AppShell>
    );
};

/**
 * Main application entry point.
 * Sets up the safe area provider and navigation container.
 * @returns {JSX.Element} The root component.
 */
export default function App() {
    return (
        <NavigationContainer>
            <CorporateRegistrationWrapper />
        </NavigationContainer>
    );
}
