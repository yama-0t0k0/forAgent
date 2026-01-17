import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DataProvider } from './src/context/DataContext';
import { GenericRegistrationScreen } from './src/screens/GenericRegistrationScreen';
import { THEME } from './src/constants/theme';


const Tab = createBottomTabNavigator();

import { EngineerRegistrationWrapper } from './src/apps/EngineerApp';
import { CompanyRegistrationWrapper } from './src/apps/CompanyApp';

export default function App() {
  const appMode = process.env.EXPO_PUBLIC_APP_MODE; // 'engineer' | 'company'

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          {appMode === 'engineer' ? (
            <EngineerRegistrationWrapper />
          ) : appMode === 'company' ? (
            <CompanyRegistrationWrapper />
          ) : (
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: THEME.background,
                  borderTopColor: THEME.cardBorder,
                  height: 40, // Compact height
                  paddingBottom: 0,
                  paddingTop: 0,
                },
                tabBarActiveTintColor: THEME.accent,
                tabBarInactiveTintColor: THEME.subText,
                tabBarLabelStyle: {
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 0,
                  position: 'absolute', // Center the label vertically
                  top: 10,
                  bottom: 10, // Ensure it's centered
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                },
                tabBarIconStyle: {
                  display: 'none',
                },
              }}
            >
              <Tab.Screen
                name="Engineer"
                component={EngineerRegistrationWrapper}
                options={{ title: 'エンジニア登録' }}
              />
              <Tab.Screen
                name="Company"
                component={CompanyRegistrationWrapper}
                options={{ title: '企業登録' }}
              />
            </Tab.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Styles can be added here if needed
});
