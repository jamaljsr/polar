import { AppSettings } from 'types';

// this needs to match the id of the theme <link> element in /public/index.html
const DOM_ID = 'theme';

export const changeTheme = (theme: AppSettings['theme']) => {
  const dom = document.getElementById(DOM_ID) as HTMLLinkElement;
  if (dom) {
    dom.href = `/themes/${theme}.css`;
  }
};
