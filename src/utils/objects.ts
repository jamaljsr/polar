const isArray = (arg: any) => Array.isArray(arg);

const isObject = (arg: any) =>
  arg === Object(arg) && !isArray(arg) && typeof arg !== 'function';

/**
 * Converts a string from snake case to camel case
 * ex: 'my_fav_text' -> 'myFavText'
 * @param key the string to convert from snake_case to camelCase
 */
const toCamel = (key: string) => {
  // use regex to replace underscore + lowercase char with uppercase char
  // ex: _a -> A
  return key.replace(/([_][a-z])/gi, underChar => {
    return underChar.substring(1).toUpperCase();
  });
};

/**
 * Recursively converts all the keys in the provided object to be camelCase
 * @param arg the object to convert
 */
export const snakeKeysToCamel = (arg: any): any => {
  if (isObject(arg)) {
    const newObj: Record<string, any> = {};
    // convert each key to camel case
    Object.keys(arg).forEach(k => {
      newObj[toCamel(k)] = snakeKeysToCamel(arg[k]);
    });
    return newObj;
  } else if (isArray(arg)) {
    const arr = arg as Array<any>;
    return arr.map(i => {
      return snakeKeysToCamel(i);
    });
  }

  return arg;
};
