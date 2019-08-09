/// <reference types="react-scripts" />

declare module '*.module.less';

interface LocalConfig {
  fallbackLng: string;
  languages: {
    [key: string]: string;
  };
}
