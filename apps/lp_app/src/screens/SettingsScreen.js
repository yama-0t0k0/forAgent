import React from 'react';
import { View } from 'react-native';
import { AppMenuScreen } from '@shared/src/features/profile/AppMenuScreen';
import { auth } from '../features/firebase/config';

/**
 * Settings Screen for LP App
 * Uses the universal AppMenuScreen with 'lp' role.
 *
 * @param {object} props
 * @param {object} props.navigation
 * @returns {React.JSX.Element}
 */
const SettingsScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <AppMenuScreen
                role='lp'
                navigation={navigation}
                showBack={true}
                onLogout={async () => {
                    await auth.signOut();
                }}
            />
        </View>
    );
};

export default SettingsScreen;
