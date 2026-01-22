import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { CompanyDetailScreen } from '../CompanyDetailScreen';
import { db } from '@shared/src/core/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// モックの設定
jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('@shared/src/core/state/DataContext', () => {
  const React = require('react');
  return {
    DataProvider: ({ children, initialData }) => (
      <mock-DataProvider initialData={initialData}>{children}</mock-DataProvider>
    ),
    DataContext: React.createContext({ data: {} }),
  };
});

jest.mock('@shared/src/core/firebaseConfig', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../../../../../../../corporate_user_app/expo_frontend/src/features/company_profile/CompanyPageScreen', () => ({
  CompanyPageScreen: () => <mock-CompanyPageScreen />,
}));

const mockUseRoute = require('@react-navigation/native').useRoute;

describe('CompanyDetailScreen Firestore Priority Tests', () => {
  const companyId = 'test_company_id';
  const companyData = { name: 'Test Company' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ params: { companyId } });
  });

  it('should fetch from "Company" collection first', async () => {
    // Setup mocks
    const mockSnapCompany = { exists: () => true, id: companyId, data: () => ({ ...companyData, source: 'Company' }) };
    
    // docの呼び出しに対して、コレクション名に応じて異なる参照を返すようにモックするわけではなく
    // getDocの戻り値を制御する必要があるが、getDocはdocRefを受け取る。
    // doc関数の呼び出し順序と引数を検証することで、優先順位を確認できる。
    
    // シナリオ: 最初の getDoc (Company) が成功する
    getDoc.mockResolvedValueOnce(mockSnapCompany);

    render(<CompanyDetailScreen />);

    await waitFor(() => {
      // 最初の呼び出しは Company コレクションであるべき
      expect(doc).toHaveBeenNthCalledWith(1, db, 'Company', companyId);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });
  });

  it('should fallback to "company" collection if "Company" fails', async () => {
    // Setup mocks
    const mockSnapCompanyFail = { exists: () => false };
    const mockSnapLowerCaseCompany = { exists: () => true, id: companyId, data: () => ({ ...companyData, source: 'company' }) };

    getDoc
      .mockResolvedValueOnce(mockSnapCompanyFail) // 1st call (Company) fails
      .mockResolvedValueOnce(mockSnapLowerCaseCompany); // 2nd call (company) succeeds

    render(<CompanyDetailScreen />);

    await waitFor(() => {
      expect(doc).toHaveBeenNthCalledWith(1, db, 'Company', companyId);
      expect(doc).toHaveBeenNthCalledWith(2, db, 'company', companyId);
      expect(getDoc).toHaveBeenCalledTimes(2);
    });
  });

  it('should fallback to "corporate" collection if "Company" and "company" fail', async () => {
    // Setup mocks
    const mockSnapCompanyFail = { exists: () => false };
    const mockSnapLowerCaseCompanyFail = { exists: () => false };
    const mockSnapCorporate = { exists: () => true, id: companyId, data: () => ({ ...companyData, source: 'corporate' }) };

    getDoc
      .mockResolvedValueOnce(mockSnapCompanyFail) // 1st call (Company) fails
      .mockResolvedValueOnce(mockSnapLowerCaseCompanyFail) // 2nd call (company) fails
      .mockResolvedValueOnce(mockSnapCorporate); // 3rd call (corporate) succeeds

    render(<CompanyDetailScreen />);

    await waitFor(() => {
      expect(doc).toHaveBeenNthCalledWith(1, db, 'Company', companyId);
      expect(doc).toHaveBeenNthCalledWith(2, db, 'company', companyId);
      expect(doc).toHaveBeenNthCalledWith(3, db, 'corporate', companyId);
      expect(getDoc).toHaveBeenCalledTimes(3);
    });
  });
});
