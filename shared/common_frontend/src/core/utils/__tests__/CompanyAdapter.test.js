import { adaptCompanyData } from '../CompanyAdapter';

describe('CompanyAdapter', () => {
    test('should handle empty data gracefully', () => {
        const result = adaptCompanyData({});
        expect(result.companyName).toBe('会社名未設定');
        expect(result.businessContent).toBe('事業内容が設定されていません。');
        expect(result.backgroundUrl).toBeNull();
        expect(result.logoUrl).toBeNull();
        expect(result.raw.techStack).toEqual({});
    });

    test('should extract data from nested \'会社概要\' structure', () => {
        const input = {
            '会社概要': {
                '社名': 'Test Company',
                '事業内容': 'Making great software',
                '背景画像URL': 'http://example.com/bg.png',
                'ロゴ画像URL': 'http://example.com/logo.png'
            },
            '技術スタック': {
                languages: { main: 'JS' }
            }
        };

        const result = adaptCompanyData(input);
        expect(result.companyName).toBe('Test Company');
        expect(result.businessContent).toBe('Making great software');
        expect(result.backgroundUrl).toBe('http://example.com/bg.png');
        expect(result.logoUrl).toBe('http://example.com/logo.png');
        expect(result.raw.techStack).toEqual(input['技術スタック']);
    });

    test('should fallback to flat fields (Admin App compatibility)', () => {
        const input = {
            name: 'Flat Company',
            description: 'Flat description',
            backgroundUrl: 'http://flat.com/bg.png',
            logoUrl: 'http://flat.com/logo.png'
        };

        const result = adaptCompanyData(input);
        expect(result.companyName).toBe('Flat Company');
        expect(result.businessContent).toBe('Flat description');
        expect(result.backgroundUrl).toBe('http://flat.com/bg.png');
        expect(result.logoUrl).toBe('http://flat.com/logo.png');
    });

    test('should prioritize nested \'会社概要\' over flat fields', () => {
        const input = {
            '会社概要': {
                '社名': 'Priority Nested'
            },
            name: 'Ignored Flat'
        };

        const result = adaptCompanyData(input);
        expect(result.companyName).toBe('Priority Nested');
    });
});
