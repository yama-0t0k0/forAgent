import React from 'react';
import { GenericImageEditScreen } from './GenericImageEditScreen';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { View } from 'react-native';

/**
 * @typedef {Object} IndividualImageEditScreenProps
 * @property {Object} navigation - Navigation object
 * @property {Object} route - Route object
 */

/**
 * Individual Image Edit Screen
 * Wrapper around GenericImageEditScreen for Individual Users.
 * Configured with individual-specific data keys and collection names.
 * 
 * @param {IndividualImageEditScreenProps} props
 * @param {Object} props.navigation - Navigation object
 * @param {Object} props.route - Route object
 */
export const IndividualImageEditScreen = ({ navigation, route }) => {
    return (
        <View style={{ flex: 1 }}>
            <GenericImageEditScreen
                dataSectionKey='基本情報'
                collectionName='public_profile'
                idFieldKey='id_individual'
                mainImageConfig={{
                    key: 'プロフィール画像URL',
                    label: 'プロフィール画像 URL',
                    placeholder: 'https://example.com/profile.jpg',
                    icon: 'person-outline',
                    previewLabel: '顔写真プレビュー'
                }}
                bgImageConfig={{
                    key: '背景画像URL',
                    label: '背景画像 URL',
                    placeholder: 'https://example.com/background.jpg',
                    icon: 'image-outline',
                    previewLabel: '背景プレビュー'
                }}
            />
            <BottomNav navigation={navigation} activeTab='Menu' />
        </View>
    );
};
