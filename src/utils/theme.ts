import { AppSettings } from 'types';

// this needs to match the id of the theme <link> element in /public/index.html
export const DOM_ID = 'theme';

export const changeTheme = (theme: AppSettings['theme']) => {
  const dom = document.getElementById(DOM_ID) as HTMLLinkElement;
  if (dom) {
    dom.href = `${process.env.PUBLIC_URL}/themes/${theme}.css`;
  }
};
