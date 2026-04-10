import * as React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/HomeScreen';
import { CompanyOverviewScreen, PurposeScreen, RecruitmentInfoScreen } from '../screens/HomeScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import LoginScreen from '../screens/LoginScreen';
import PasskeyLoginScreen from '../screens/PasskeyLoginScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InvitationCodeScreen from '../screens/InvitationCodeScreen';
import RegistrationMethodScreen from '../screens/RegistrationMethodScreen';
import RegistrationFormScreen from '../screens/RegistrationFormScreen';
import { logScreenView } from '../features/analytics';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['https://admin-app-site-d11f0.web.app', 'http://localhost:8089', '/'],
  config: {
    initialRouteName: 'Home',
    screens: {
      Home: {
        path: 'lp',
        exact: true,
      },
      PrivacyPolicy: {
        path: 'lp/PrivacyPolicy',
      },
      Login: {
        path: 'lp/Login',
      },
      PasskeyLogin: {
        path: 'lp/PasskeyLogin',
      },
    },
  },
};


function AppNavigation() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = React.useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          routeNameRef.current = currentRoute.name;
          logScreenView(routeNameRef.current);
        }
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute();
        const currentRouteName = currentRoute?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          await logScreenView(currentRouteName);
          routeNameRef.current = currentRouteName;
        }
      }}
    >
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InvitationCode"
          component={InvitationCodeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegistrationMethod"
          component={RegistrationMethodScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegistrationForm"
          component={RegistrationFormScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PasskeyLogin"
          component={PasskeyLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompanyOverview"
          component={CompanyOverviewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Purpose"
          component={PurposeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RecruitmentInfo"
          component={RecruitmentInfoScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigation;
