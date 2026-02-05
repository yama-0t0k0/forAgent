import React from 'react';
import { GenericImageEditScreen } from './GenericImageEditScreen';
import { BottomNav } from '@shared/src/core/components/BottomNav';
import { View } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '@shared/src/core/models/User';

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
                customSaveLogic={async (db, id, data) => {
                    const { publicData, privateData } = User.splitData(data);
                    await setDoc(doc(db, 'public_profile', id), publicData);
                    // Image edit might only update public fields, but if 'data' contains private fields (from context),
                    // we must ensure they are saved to private_info or at least not exposed to public.
                    // splitData handles this. We save privateData to ensure consistency if it exists.
                    if (privateData && Object.keys(privateData).length > 0) {
                        await setDoc(doc(db, 'private_info', id), privateData, { merge: true });
                    }
                }}
            />
            <BottomNav navigation={navigation} activeTab='Menu' />
        </View>
    );
};
