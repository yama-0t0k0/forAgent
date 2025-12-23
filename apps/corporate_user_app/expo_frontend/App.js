import React from 'react';
import { StatusBar } from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { THEME } from '@shared/src/core/theme/theme';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';
import { CompanyPageScreen } from './src/features/company_profile/CompanyPageScreen';
import { MenuScreen } from './src/features/company_profile/MenuScreen';
import { ImageEditScreen } from './src/features/company_profile/ImageEditScreen';

const COMPANY_TEMPLATE = require('./assets/json/company-profile-template.json');
const Stack = createNativeStackNavigator();

const CorporateRegistrationWrapper = () => (
    <DataProvider initialData={COMPANY_TEMPLATE}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="CompanyPage">
            <Stack.Screen name="CompanyPage" component={CompanyPageScreen} />
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
