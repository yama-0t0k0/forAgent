import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobDescriptionScreen } from '../features/job_description/JobDescriptionScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => (
    <Stack.Navigator initialRouteName="JobDescription" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="JobDescription" component={JobDescriptionScreen} />
    </Stack.Navigator>
);
