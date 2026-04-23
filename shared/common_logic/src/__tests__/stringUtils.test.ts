import { reverseString } from '../stringUtils';

describe('reverseString', () => {
  it('should reverse a simple string', () => {
    expect(reverseString('hello')).toBe('olleh');
  });

  it('should handle an empty string', () => {
    expect(reverseString('')).toBe('');
  });

  it('should handle strings with spaces', () => {
    expect(reverseString('a b c')).toBe('c b a');
  });
});
