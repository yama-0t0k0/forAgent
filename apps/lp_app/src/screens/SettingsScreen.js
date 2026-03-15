import React from 'react';
import { View } from 'react-native';
import { AppMenuScreen } from '../../../../shared/common_frontend/src/features/profile/AppMenuScreen';

/**
 * Settings Screen for LP App
 * Uses the universal AppMenuScreen with 'lp' role.
 */
const SettingsScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <AppMenuScreen
                role="lp"
                navigation={navigation}
                showBack={true}
            />
        </View>
    );
};

export default SettingsScreen;
