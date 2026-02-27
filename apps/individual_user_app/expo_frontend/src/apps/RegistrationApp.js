import React from 'react';
import { DataProvider } from '@shared/src/core/state/DataContext';
import { PureRegistrationScreen } from '@shared/src/features/registration/PureRegistrationScreen';

const ENGINEER_TEMPLATE = require('@assets/json/engineer-profile-template.json');

/**
 * RegistrationApp
 * A pure registration experience for individual users.
 * Hides bottom navigation and focuses on the registration flow.
 */
export const RegistrationApp = () => (
    <DataProvider initialData={ENGINEER_TEMPLATE}>
        <PureRegistrationScreen
            title='エンジニア個人登録'
            collectionName='individual'
            idField='id_individual'
            idPrefixChar='C'
            useSequentialId={false}
        />
    </DataProvider>
);
