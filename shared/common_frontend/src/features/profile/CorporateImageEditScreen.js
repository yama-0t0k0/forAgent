import React from 'react';
import { GenericImageEditScreen } from './GenericImageEditScreen';
import { CorporateBottomNav } from '@shared/src/core/components/CorporateBottomNav';
import { View } from 'react-native';
import { Company } from '@shared/src/core/models/Company';

/**
 * @typedef {Object} CorporateImageEditScreenProps
 * @property {Object} navigation - Navigation object
 * @property {Object} route - Route object
 */

/**
 * Corporate Image Edit Screen
 * Wrapper around GenericImageEditScreen for Corporate Users.
 * Configured with corporate-specific data keys and collection names.
 * 
 * @param {CorporateImageEditScreenProps} props
 * @param {Object} props.navigation - Navigation object
 * @param {Object} props.route - Route object
 */
export const CorporateImageEditScreen = ({ navigation, route }) => {
    return (
        <View style={{ flex: 1 }}>
            <GenericImageEditScreen
                dataSectionKey={Company.FIELDS.PROFILE}
                collectionName='company'
                idFieldKey='id'
                mainImageConfig={{
                    key: Company.FIELDS.LOGO_URL,
                    label: 'ロゴ画像 URL',
                    placeholder: 'https://example.com/logo.jpg',
                    icon: 'business-outline',
                    previewLabel: 'ロゴプレビュー'
                }}
                bgImageConfig={{
                    key: Company.FIELDS.BACKGROUND_URL,
                    label: '背景画像 URL',
                    placeholder: 'https://example.com/background.jpg',
                    icon: 'image-outline',
                    previewLabel: '背景プレビュー'
                }}
            />
            <CorporateBottomNav navigation={navigation} activeTab='Menu' />
        </View>
    );
};
