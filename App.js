import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DataProvider } from './src/context/DataContext';
import { GenericRegistrationScreen } from './src/screens/GenericRegistrationScreen';
import { THEME } from './src/constants/theme';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyPageScreen } from './src/screens/MyPageScreen';
import { ImageEditScreen } from './src/screens/ImageEditScreen';
import { MenuScreen } from './src/screens/MenuScreen';

const ENGINEER_TEMPLATE = require('./assets/json/engineer-profile-template.json');
const COMPANY_TEMPLATE = require('./assets/json/company-profile-template.json');

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const EngineerNavigator = () => (
  <Stack.Navigator initialRouteName="MyPage" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Registration">
      {(props) => (
        <GenericRegistrationScreen
          {...props}
          title="エンジニア個人登録"
          collectionName="individual"
          idField="id_individual"
          idPrefixChar="C"
        />
      )}
    </Stack.Screen>
    <Stack.Screen name="MyPage" component={MyPageScreen} />
    <Stack.Screen name="ImageEdit" component={ImageEditScreen} />
    <Stack.Screen name="Menu" component={MenuScreen} />
  </Stack.Navigator>
);

const EngineerRegistrationWrapper = () => (
  <DataProvider initialData={ENGINEER_TEMPLATE}>
    <EngineerNavigator />
  </DataProvider>
);

const CompanyRegistrationWrapper = () => (
  <DataProvider initialData={COMPANY_TEMPLATE}>
    <GenericRegistrationScreen
      title="企業プロフィール登録"
      collectionName="company"
      idField="id"
      idPrefixChar="B"
    />
  </DataProvider>
);

export default function App() {
  const appMode = process.env.EXPO_PUBLIC_APP_MODE; // 'engineer' | 'company'

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <EngineerRegistrationWrapper />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Styles can be added here if needed
});
