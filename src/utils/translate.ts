import i18n from 'i18next';

/**
 * A utility function which returns a `t` function that inserts a prefix in each key lookup
 * @param prefix the prefix to use for all translation keys
 */
export const prefixTranslation = (prefix: string) => {
  // the new `t` function that will append the prefix
  const translate = (key: string, options?: string | object) => {
    return i18n.t(`${prefix}.${key}`, options);
  };

  return {
    l: translate,
  };
};
