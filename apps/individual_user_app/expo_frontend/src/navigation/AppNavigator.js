import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyPageScreen } from '../features/profile/MyPageScreen';
import { ImageEditScreen } from '../features/profile/ImageEditScreen';
import { MenuScreen } from '../features/profile/MenuScreen';
import { GenericRegistrationScreen } from '@shared/src/features/registration/GenericRegistrationScreen';

const Stack = createNativeStackNavigator();

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
                />
            )}
        </Stack.Screen>
        <Stack.Screen name="MyPage" component={MyPageScreen} />
        <Stack.Screen name="ImageEdit" component={ImageEditScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
    </Stack.Navigator>
);
