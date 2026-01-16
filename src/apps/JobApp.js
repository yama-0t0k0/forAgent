import React from 'react';
import { DataProvider } from '../context/DataContext';
import { GenericRegistrationScreen } from '../screens/GenericRegistrationScreen';

const JOB_TEMPLATE = require('../../assets/json/job-description-template.json');

export const JobRegistrationWrapper = () => (
  <DataProvider initialData={JOB_TEMPLATE}>
    <GenericRegistrationScreen
      title="求人登録"
      collectionName="job_description"
      idField="JD_Number"
      idPrefixChar="J"
      extraHeaderFields={['company_ID']}
      idLabel="JD_Number"
    />
  </DataProvider>
);
