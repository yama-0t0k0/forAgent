import React from 'react';
import { DataProvider } from '../context/DataContext';
import { GenericRegistrationScreen } from '../screens/GenericRegistrationScreen';

const COMPANY_TEMPLATE = require('../../assets/json/company-profile-template.json');

export const CompanyRegistrationWrapper = () => (
  <DataProvider initialData={COMPANY_TEMPLATE}>
    <GenericRegistrationScreen
      title="企業プロフィール登録"
      collectionName="company"
      idField="id"
      idPrefixChar="B"
    />
  </DataProvider>
);
