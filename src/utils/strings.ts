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
  return compareVersions(version, maxVersion) <= 0;
};

/**
 * Checks if the version provided is lower than the maximum version provided.
 */
export const isVersionBelow = (version: string, maxVersion: string): boolean => {
  return compareVersions(version, maxVersion) < 0;
};

/**
 * Compares two versions and returns a number indicating if the first version is higher,
 * lower, or equal to the second version.
 * @returns 0 if the versions are equal, 1 if the first version is higher, and -1 if the
 * first version is lower
 */
export const compareVersions = (aVersion: string, bVersion: string): number => {
  // sanity checks
  if (!aVersion || !bVersion) return 0;

  // helper function to split the version into an array of numbers using a regex
  const split = (ver: string) => [...ver.matchAll(/\d+/g)].map(a => parseInt(a[0]));

  // convert version into a number array
  const aParts = split(aVersion);
  // convert minVersion into a number array
  const bParts = split(bVersion);

  // get the longest length of the two versions. May be 3 or 4 with bitcoind
  const len = Math.max(aParts.length, bParts.length);
  // loop over each number in the version from left ot right
  for (let i = 0; i < len; i++) {
    const aNum = aParts[i] || 0;
    const bNum = bParts[i] || 0;
    // if the digit is higher, then return a positive number
    if (aNum < bNum) return -1;
    // if the digit is lower, then return a negative number
    if (aNum > bNum) return 1;
    // if the digits are equal, check the next digit
  }

  // if all digits are equal, return 0
  return 0;
};
