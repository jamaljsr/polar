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

/**
 * Checks if the version provided is equal or lower than the maximum version provided.
 * @param version the version to compare
 * @param maxVersion the maximum version allowed
 *
 * @example
 * isVersionCompatible('0.18.0', '0.18.1') => true
 * isVersionCompatible('0.18.1', '0.18.1') => true
 * isVersionCompatible('0.19.0.1', '0.18.1') => false
 */
export const isVersionCompatible = (version: string, maxVersion: string): boolean => {
  // sanity checks
  if (!version || !maxVersion) return false;
  // convert version into a number array
  const versionParts = version.split('.').map(n => parseInt(n));
  // convert maxversion into a number array
  const maxParts = maxVersion.split('.').map(n => parseInt(n));
  // get the longest length of the two versions. May be 3 or 4 with bitcoind
  const len = Math.max(versionParts.length, maxParts.length);
  // loop over each number in the version from left ot right
  for (let i = 0; i < len; i++) {
    const ver = versionParts[i];
    const max = maxParts[i];
    // if version has more digits than maxVersion, return the result of the previous digit
    // '0.18.0.1' <= '0.18.1' = true
    // '0.18.1.1' <= '0.18.1' = false
    if (max === undefined) return versionParts[i - 1] < maxParts[i - 1];
    // bail for non-numeric input
    if (isNaN(ver) || isNaN(max)) return false;
    // if any number is higher, then the version is not compatible
    if (ver > max) return false;
    // if the numder is lower, then return true immediately
    if (ver < max) return true;
    //if the digits are equal, check the next digit
  }
  return true;
};
