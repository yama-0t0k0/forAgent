import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '@shared/src/core/theme/theme';
import { JobDescriptionContent } from './components/JobDescriptionContent';

/**
 * Screen for displaying a specific job description.
 * @param {object} props - Component props
 * @param {object} props.route - Navigation route (contains params)
 * @param {string} [props.companyId] - Optional direct company ID override
 * @param {string} [props.jdNumber] - Optional direct JD number override
 * @returns {JSX.Element} The rendered screen.
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
