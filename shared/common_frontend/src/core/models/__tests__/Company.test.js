
import { Company } from '../Company';

describe('Company Model', () => {
    describe('fromFirestore', () => {
        it('should use flat name when no nested profile exists', () => {
            const data = { companyName: 'Flat Company' };
            const company = Company.fromFirestore('test-id', data);
            expect(company.name).toBe('Flat Company');
        });

        it('should use nested name when available', () => {
            const data = {
                '会社概要': { '社名': 'Nested Company' }
            };
            const company = Company.fromFirestore('test-id', data);
            expect(company.name).toBe('Nested Company');
        });

        it('should prioritize nested name over flat name for normal cases', () => {
            const data = {
                companyName: 'Flat Name',
                '会社概要': { '社名': 'Nested Name' }
            };
            const company = Company.fromFirestore('test-id', data);
            expect(company.name).toBe('Nested Name');
        });

        // The Fix Verification
        it('should prioritize flat name if nested name is the template placeholder \'ヤヲー株式会社\'', () => {
            const data = {
                companyName: 'Real Company Name', // Correct name
                '会社概要': { '社名': 'ヤヲー株式会社' } // Template artifact
            };
            const company = Company.fromFirestore('test-id', data);
            expect(company.name).toBe('Real Company Name');
        });

        it('should keep template name if no flat name is available', () => {
            const data = {
                '会社概要': { '社名': 'ヤヲー株式会社' }
            };
            const company = Company.fromFirestore('test-id', data);
            expect(company.name).toBe('ヤヲー株式会社');
        });

        it('should handle empty data gracefully', () => {
            const company = Company.fromFirestore('test-id', null);
            expect(company.name).toBe('');
            expect(company.id).toBe('test-id');
        });
    });
});
