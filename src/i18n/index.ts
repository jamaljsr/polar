import { initReactI18next } from 'react-i18next';
import { app, remote } from 'electron';
import i18n from 'i18next';
import { LocaleConfig } from 'types';

export const localeConfig: LocaleConfig = {
  fallbackLng: 'en-US',
  languages: {
    'en-US': 'English',
    'es-ES': 'Español',
    'fr-FR': 'French',
    'de-DE': 'German',
    'ru-RU': 'Russian',
    'it-IT': 'Italian',
    'zh-CN': 'Chinese Simplified',
    'pt-BR': 'Portuguese, Brazilian',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
  },
};

const resources = Object.keys(localeConfig.languages).reduce(
  (acc: { [key: string]: any }, lang) => {
    acc[lang] = {
      translation: require(`./locales/${lang}.json`),
    };
    return acc;
  },
  Object,
);

const detectLang = () => {
  const lang = (app || remote.app).getLocale();
  // look for an exact match
  const exact = localeConfig.languages[lang] && lang;
  if (exact) return exact;
  // look for a match of the first two chars
  const prefix = lang.slice(0, 2);
  const partial = Object.keys(localeConfig.languages)
    .map(l => l.slice(0, 2))
    .find(l => l === prefix);
  if (partial) return partial;
  // return the fallback language for no matches
  return localeConfig.fallbackLng;
};

const whitelist = Object.keys(localeConfig.languages).reduce((acc: string[], lang) => {
  acc.push(lang);

  if (lang.includes('-')) {
    acc.push(lang.substring(0, lang.indexOf('-')));
  }

  return acc;
}, []);

i18n.use(initReactI18next).init({
  lng: detectLang(),
  resources,
  whitelist,
  fallbackLng: localeConfig.fallbackLng,
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
