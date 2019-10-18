/**
 * Shortens text by removing a portion of characters from the middle and only
 * keeping a small subset of the outer left and right sides
 * @param text the text to shorten
 * @param charsToKeep the number of characters to keep on both sides unless `rightCharsToKeep` is provided
 * @param rightCharsToKeep the number of characters to keep on the right side
 *
 * @example
 * const letters = 'abcdefghijklmnopqrstuvwxyz';
 * ellipseInner(letters, 3); // 'abc...xyz'
 * ellipseInner(letters, 5); // 'abcde...vwxyz'
 * ellipseInner(letters, 4, 2) // 'abcd...yz'
 */
export const ellipseInner = (
  text: string,
  charsToKeep = 6,
  rightCharsToKeep?: number,
): string => {
  if (!text) return text;
  if (!charsToKeep || charsToKeep <= 0) charsToKeep = 6;
  if (!rightCharsToKeep) rightCharsToKeep = charsToKeep;
  if (text.length <= charsToKeep + rightCharsToKeep) return text;
  const firstChars = text.substring(0, charsToKeep);
  const lastChars = text.substring(text.length - rightCharsToKeep);
  return `${firstChars}...${lastChars}`;
};
