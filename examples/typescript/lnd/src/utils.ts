/**
 * Replaces the middle of a string with ellipses.
 *
 * @example
 * // returns '03f1...7472'
 * cropStringMiddle('03f101adfdb17bcca537b46c8bed691f88f9949865f448479a9245646f2b5c7472', 4);
 * @param str
 * @param around
 */
export const cropStringMiddle = (str: string, around: number) => {
  if (around * 2 >= str.length) {
    return str;
  }
  return str.substr(0, around) + '...' + str.substr(str.length - around, str.length);
};
