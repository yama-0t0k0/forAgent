import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@shared/src/core/firebaseConfig';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { CompanyPageScreen } from '@shared/src/features/company_profile/screens/CompanyPageScreen';
import { MenuScreen } from '@shared/src/features/company_profile/screens/MenuScreen';
import { ImageEditScreen } from '@shared/src/features/company_profile/screens/ImageEditScreen';
import { TechStackScreen } from '@shared/src/features/company_profile/screens/TechStackScreen';
import { UnderConstructionScreen } from '@shared/src/features/company_profile/screens/UnderConstructionScreen';

const COMPANY_TEMPLATE = require('./assets/json/company-profile-template.json');
const Stack = createNativeStackNavigator();

const CorporateRegistrationWrapper = () => {
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hardcoded ID for now as per template
                const docRef = doc(db, 'company', 'B00000');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setInitialData(docSnap.data());
                } else {
                    console.log("No such document! Using template.");
                    setInitialData(COMPANY_TEMPLATE);
                }
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
                <Stack.Screen name="Menu" component={MenuScreen} />
                <Stack.Screen name="ImageEdit" component={ImageEditScreen} />
                <Stack.Screen name="Registration">
                    {(props) => (
                        <GenericRegistrationScreen
                            {...props}
                            title="企業プロフィール登録"
                            collectionName="company"
                            idField="id"
                            idPrefixChar="B"
                            homeRouteName="CompanyPage"
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </DataProvider>
    );
};

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
