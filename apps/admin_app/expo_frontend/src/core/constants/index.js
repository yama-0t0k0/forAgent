/**
 * Admin App Global Constants
 */

// Dashboard Tab IDs
export const DASHBOARD_TABS = {
  DASHBOARD: 'dashboard',
  INDIVIDUAL: 'individual',
  COMPANY: 'company',
  JOB: 'job',
  SELECTION: 'selection'
};

// E2E / Testing Configuration
export const E2E_CONFIG = {
  DUMMY_USER_ID: 'C000000000000',
  USE_MOCK_DATA: true // Set to true for E2E testing to bypass Firestore
};

// Mock Data for E2E
export const MOCK_ADMIN_DATA = {
  users: [
    {
      id: 'C000000000000',
      name: 'E2E Test User',
      rawData: {
        '基本情報': { '姓': 'E2E', '名': 'User', 'メールアドレス': 'e2e@example.com' },
        createdAt: Date.now()
      }
    }
  ],
  corporate: [
    {
      id: 'B00000',
      name: 'E2E Corp',
      rawData: { companyName: 'E2E Corp', createdAt: Date.now() }
    }
  ],
  jd: [],
  fmjs: []
};

// Company Data Constants
export const COMPANY_DATA = {
  SECTION_PROFILE: '会社概要',
  FIELD_NAME: '社名',
  TEMPLATE_NAME_YAWO: 'ヤヲー株式会社',
  NO_NAME: '名称未設定',
  NO_DESCRIPTION: '事業内容が設定されていません。'
};

// UI Mock Data
export const MOCK_DATA = {
  NOTIFICATION_COUNT: 3
};
