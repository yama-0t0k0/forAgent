import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobDescriptionScreen } from '../features/job_description/JobDescriptionScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';

const Stack = createNativeStackNavigator();

/**
 * Main application navigator.
 * Configures the navigation stack and screens.
 * @returns {JSX.Element} The navigation stack.
 */
export const AppNavigator = () => (
    <Stack.Navigator initialRouteName="JobDescription" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="JobDescription" component={JobDescriptionScreen} />
        <Stack.Screen name="JobEdit">
            {(props) => (
                <GenericRegistrationScreen
                    {...props}
                    title="求人情報編集"
                    collectionName="jobs"
                    idField="JD_Number"
                    idPrefixChar="J"
                    homeRouteName="JobDescription"
                />
            )}
        </Stack.Screen>
    </Stack.Navigator>
);
