import React from 'react';
import { DataProvider } from '../context/DataContext';
import { GenericRegistrationScreen } from '../screens/GenericRegistrationScreen';

const ENGINEER_TEMPLATE = require('../../assets/json/engineer-profile-template.json');

export const EngineerRegistrationWrapper = () => (
  <DataProvider initialData={ENGINEER_TEMPLATE}>
    <GenericRegistrationScreen
      title="エンジニア個人登録"
      collectionName="individual"
      idField="id_individual"
      idPrefixChar="C"
    />
  </DataProvider>
);
