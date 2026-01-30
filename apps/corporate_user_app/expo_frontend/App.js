import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
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

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background }}>
                <ActivityIndicator size="large" color={THEME.primary || '#000'} />
            </View>
        );
    }

    return (
        <DataProvider initialData={initialData}>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="CompanyPage">
                <Stack.Screen name="CompanyPage" component={CompanyPageScreen} />
                <Stack.Screen name="TechStack" component={TechStackScreen} />
                <Stack.Screen name="Jobs" component={UnderConstructionScreen} initialParams={{ title: '求人' }} />
                <Stack.Screen name="Connections" component={UnderConstructionScreen} initialParams={{ title: 'つながり' }} />
                <Stack.Screen name="Blog" component={UnderConstructionScreen} initialParams={{ title: 'ブログ' }} />
                <Stack.Screen name="Events" component={UnderConstructionScreen} initialParams={{ title: 'イベント' }} />
                <Stack.Screen name="Menu" component={CorporateMenuScreen} />
                <Stack.Screen name="ImageEdit" component={CorporateImageEditScreen} />
                <Stack.Screen name="Registration">
                    {(props) => (
                        <GenericRegistrationScreen
                            {...props}
                            title="企業プロフィール登録"
                            collectionName="company"
                            idField="id"
                            idPrefixChar="B"
                            homeRouteName="CompanyPage"
                            BottomNavComponent={CorporateBottomNav}
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </DataProvider>
    );
};

/**
 * Main application entry point.
 * Sets up the safe area provider and navigation container.
 * @returns {JSX.Element} The root component.
 */
export default function App() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
                <StatusBar barStyle="dark-content" />
                <NavigationContainer>
                    <CorporateRegistrationWrapper />
                </NavigationContainer>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
