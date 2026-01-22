import { formatCompanyData } from '../companyDataFormatter';

describe('formatCompanyData', () => {
  it('should return empty object if companyData is null or undefined', () => {
    expect(formatCompanyData(null)).toEqual({});
    expect(formatCompanyData(undefined)).toEqual({});
  });

  it('should format flat data into nested structure', () => {
    const flatData = {
      companyName: 'Test Company',
      businessContent: 'Test Business',
      address: 'Test Address',
      features: { 'Remote': true },
      tech_stack: { languages: 'JS' }
    };

    const result = formatCompanyData(flatData);

    expect(result['会社概要']).toEqual(expect.objectContaining({
      '社名': 'Test Company',
      '事業内容': 'Test Business',
      '住所': 'Test Address'
    }));
    expect(result['魅力/特徴']).toEqual({ 'Remote': true });
    expect(result['使用技術']).toEqual({ languages: 'JS' });
  });

  it('should prioritize flat "companyName" over template "ヤヲー株式会社" in nested data', () => {
    // This reproduces the bug seen with B00003
    const mixedData = {
      companyName: 'セーフィー株式会社',
      '会社概要': {
        '社名': 'ヤヲー株式会社', // Template data
        '事業内容': 'Template Business'
      }
    };

    const result = formatCompanyData(mixedData);

    // The fix should overwrite the template name with the correct flat name
    expect(result['会社概要']['社名']).toBe('セーフィー株式会社');
    // Other template fields might remain if we don't have replacements, 
    // but the name must be correct.
    expect(result['会社概要']['事業内容']).toBe('Template Business'); 
  });

  it('should keep nested data if it is NOT the template name', () => {
    const validNestedData = {
      companyName: 'Another Company', // Might be present
      '会社概要': {
        '社名': 'Correct Nested Name',
        '事業内容': 'Correct Business'
      }
    };

    const result = formatCompanyData(validNestedData);

    // Should NOT overwrite if the nested name is not the specific template name
    // (Assuming logic: only fix if it is 'ヤヲー株式会社')
    // Wait, my implementation only fixes if nested name IS 'ヤヲー株式会社'.
    // If nested name is different, it assumes it's correct.
    expect(result['会社概要']['社名']).toBe('Correct Nested Name');
  });
});
