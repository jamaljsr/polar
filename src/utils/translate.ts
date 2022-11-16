import i18n, { TOptions } from 'i18next';

/**
 * A utility function which returns a `t` function that inserts a prefix in each key lookup
 * @param prefix the prefix to use for all translation keys
 */
export const prefixTranslation = (prefix: string) => {
  // the new `t` function that will append the prefix
  const translate = (key: string, options?: string | TOptions<any> | undefined) => {
    return i18n.t<string>(`${prefix}.${key}`, options).toString();
  };

  return {
    l: translate,
  };
};
