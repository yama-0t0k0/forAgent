import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionContent } from '../components/JobDescriptionContent';

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
 */
export const JobDescriptionScreen = ({ route, companyId: propCompanyId, jdNumber: propJdNumber }) => {
    const navigation = useNavigation();

    // Resolve IDs from props or navigation params (fallback to default for standalone dev)
    const companyId = propCompanyId || route?.params?.companyId || 'B00000';
    const jdNumber = propJdNumber || route?.params?.jdNumber || '02';

    return (
        <View style={styles.container}>
            <JobDescriptionContent
                companyId={companyId}
                jdNumber={jdNumber}
                onEdit={() => navigation.navigate('JobEdit')}
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
