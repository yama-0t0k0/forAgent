import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionContent } from '@shared/src/features/job_profile/components/JobDescriptionContent';
import { FMJSService } from '@shared/src/core/utils/FMJSService';

/**
 * @typedef {Object} JobDescriptionScreenProps
 * @property {Object} route - Navigation route
 * @property {Object} route.params - Route parameters
 * @property {string} [route.params.companyId] - Company ID from route
 * @property {string} [route.params.jdNumber] - JD Number from route
 * @property {string} [companyId] - Company ID (direct prop)
 * @property {string} [jdNumber] - JD Number (direct prop)
 */

/**
 * Job Description Screen
 * Displays the full details of a job description.
 * 
 * @param {JobDescriptionScreenProps} props
 * @param {Object} props.route - Navigation route
 * @param {string} [props.companyId] - Company ID
 * @param {string} [props.jdNumber] - JD Number
 */
export const JobDescriptionScreen = ({ route, companyId: propCompanyId, jdNumber: propJdNumber }) => {
    const navigation = useNavigation();
    const [isApplying, setIsApplying] = useState(false);

    // Resolve IDs from props or navigation params (fallback to default for standalone dev)
    const companyId = propCompanyId || route?.params?.companyId || 'B00000';
    const jdNumber = propJdNumber || route?.params?.jdNumber || '02';

    const handleApply = async () => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            Alert.alert('エラー', 'ログインが必要です。');
            return;
        }

        if (isApplying) return;

        Alert.alert(
            '応募確認',
            'この求人に応募しますか？\n応募すると企業にあなたのプロフィールが開示されます。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '応募する',
                    onPress: async () => {
                        setIsApplying(true);
                        try {
                            const result = await FMJSService.createMatching(
                                currentUser.uid,
                                companyId,
                                jdNumber,
                                {} // jdData
                            );
                            
                            if (result.success) {
                                Alert.alert('応募完了', '応募を受け付けました。企業からの連絡をお待ちください。');
                            } else {
                                Alert.alert('エラー', '応募に失敗しました。再度お試しください。');
                            }
                        } catch (e) {
                            console.error(e);
                            Alert.alert('エラー', '予期せぬエラーが発生しました。');
                        } finally {
                            setIsApplying(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <JobDescriptionContent
                companyId={companyId}
                jdNumber={jdNumber}
                onEdit={() => navigation.navigate('JobEdit')}
                onApply={handleApply}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
    },
});
