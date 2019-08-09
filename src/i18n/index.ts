import i18n from 'i18next';
import { app, remote } from 'electron';
import { initReactI18next } from 'react-i18next';

const detectedLang = (app || remote.app).getLocale();

const config: LocalConfig = {
  fallbackLng: 'en-US',
  languages: {
    'en-US': 'English',
    es: 'Español',
  },
};

const resources = Object.keys(config.languages).reduce(
  (acc: { [key: string]: any }, lang) => {
    acc[lang] = {
      translation: require(`./locales/${lang}.json`),
    };
    return acc;
  },
  Object,
);

const whitelist = Object.keys(config.languages).reduce((acc: string[], lang) => {
  acc.push(lang);

  if (lang.includes('-')) {
    acc.push(lang.substring(0, lang.indexOf('-')));
  }

  return acc;
}, []);

i18n.use(initReactI18next).init({
  lng: detectedLang || 'en-US',
  resources,
  whitelist,
  fallbackLng: config.fallbackLng,
  debug: process.env.NODE_ENV !== 'production',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
