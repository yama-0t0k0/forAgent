/**
 * 文字列を反転させます。
 * @param str 反転させる文字列
 * @returns 反転後の文字列
 */
export const reverseString = (str: string): string => {
  return str.split('').reverse().join('');
};