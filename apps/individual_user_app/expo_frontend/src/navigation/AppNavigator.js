import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';

const Stack = createNativeStackNavigator();
const ENGINEER_TEMPLATE = require('../../assets/json/engineer-profile-template.json');

/**
 * Main application navigator.
 * Configures the navigation stack and screens.
 * @returns {JSX.Element} The navigation stack.
 */
export const AppNavigator = () => (
    <Stack.Navigator initialRouteName="MyPage" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Registration">
            {(props) => (
                <GenericRegistrationScreen
                    {...props}
                    title="エンジニア個人登録"
                    collectionName="individual"
                    idField="id_individual"
                    idPrefixChar="C"
                    orderTemplate={ENGINEER_TEMPLATE}
                />
            )}
        </Stack.Screen>
        <Stack.Screen name="MyPage" component={IndividualProfileScreen} />
        <Stack.Screen name="ImageEdit" component={IndividualImageEditScreen} />
        <Stack.Screen name="Menu" component={IndividualMenuScreen} />
        <Stack.Screen name="Connection" component={ConnectionScreen} />
        <Stack.Screen name="Career" component={CareerScreen} />
        <Stack.Screen name="JobDescription" component={JobDescriptionScreen} />
    </Stack.Navigator>
);
