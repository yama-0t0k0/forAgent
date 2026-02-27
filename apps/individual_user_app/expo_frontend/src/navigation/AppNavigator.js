import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IndividualProfileScreen } from '@shared/src/features/profile/IndividualProfileScreen';
import { IndividualImageEditScreen } from '@shared/src/features/profile/IndividualImageEditScreen';
import { IndividualMenuScreen } from '@shared/src/features/profile/IndividualMenuScreen';
import { ConnectionScreen } from '@shared/src/features/job/ConnectionScreen';
import { JobDescriptionScreen } from '@shared/src/features/job_profile/screens/JobDescriptionScreen';
import { CareerScreen } from '@shared/src/features/job/CareerScreen';
import { PureRegistrationScreen } from '@shared/src/features/registration/PureRegistrationScreen';
import { ROUTES } from '@shared/src/core/constants/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '@shared/src/core/models/User';
import { BottomNav } from '@shared/src/core/components/BottomNav';

const Stack = createNativeStackNavigator();
const ENGINEER_TEMPLATE = require('@assets/json/engineer-profile-template.json');

/**
 * Main application navigator.
 * Configures the navigation stack and screens.
 * @returns {JSX.Element} The navigation stack.
 */
export const AppNavigator = () => (
    <Stack.Navigator initialRouteName={ROUTES.INDIVIDUAL_MY_PAGE} screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ROUTES.REGISTRATION}>
            {(props) => (
                <PureRegistrationScreen
                    {...props}
                    title='エンジニア個人登録'
                    collectionName='public_profile'
                    idField='id_individual'
                    idPrefixChar='C'
                    customSaveLogic={async (db, id, data) => {
                        const { publicData, privateData } = User.splitData(data);
                        await setDoc(doc(db, 'public_profile', id), publicData);
                        await setDoc(doc(db, 'private_info', id), privateData);
                    }}
                    orderTemplate={ENGINEER_TEMPLATE}
                    showBottomNav={true}
                    BottomNavComponent={BottomNav}
                />
            )}
        </Stack.Screen>
        <Stack.Screen name={ROUTES.INDIVIDUAL_MY_PAGE} component={IndividualProfileScreen} />
        <Stack.Screen name={ROUTES.IMAGE_EDIT} component={IndividualImageEditScreen} />
        <Stack.Screen name={ROUTES.MENU} component={IndividualMenuScreen} />
        <Stack.Screen name={ROUTES.INDIVIDUAL_CONNECTION} component={ConnectionScreen} />
        <Stack.Screen name={ROUTES.INDIVIDUAL_CAREER} component={CareerScreen} />
        <Stack.Screen name={ROUTES.JOB_DESCRIPTION} component={JobDescriptionScreen} />
    </Stack.Navigator>
);
