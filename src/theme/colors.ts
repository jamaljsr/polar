import { AppSettings } from 'types';

export interface ThemeColors {
  name: AppSettings['theme'];
  switch: { background: string };
  footer: { background: string };
  pageHeader: { background: string; border: string };
  alert: { background: string; border: string };
  statusTag: { stopped: string };
  statusBadge: { default: string };
  link: { default: string };
  node: { background: string; border: string };
  port: { outer: string; inner: string; border: string };
  dragNode: { border: string; shadow: string };
}

export const themeColors: Record<AppSettings['theme'], ThemeColors> = {
  light: {
    name: 'light',
    switch: { background: 'transparent' },
    footer: { background: '#f0f2f5' },
    pageHeader: { background: '#ffffff', border: 'rgb(235, 237, 240)' },
    alert: { background: '#e6f7ff', border: '#91d5ff' },
    statusTag: { stopped: 'gray' },
    statusBadge: { default: '#d9d9d9' },
    link: { default: 'lightgray' },
    node: { background: '#ffffff', border: '#ffffff' },
    port: { outer: '#ffffff', inner: 'grey', border: '#ffffff' },
    dragNode: { border: '#e8e8e8', shadow: 'rgba(0, 0, 0, 0.1)' },
  },
  dark: {
    name: 'dark',
    switch: { background: 'rgba(43, 43, 43, 0.25)' },
    footer: { background: 'rgba(43, 43, 43, 0.25)' },
    pageHeader: { background: '#141414', border: '#303030' },
    alert: { background: '#111b26', border: '#153450' },
    statusTag: { stopped: 'rgba(255, 255, 255, 0.25)' },
    statusBadge: { default: '#757575' },
    link: { default: '#1b1b1b' },
    node: { background: '#1f1f1f', border: '#303030' },
    port: { outer: '#1f1f1f', inner: '#383838', border: '#303030' },
    dragNode: { border: '#303030', shadow: 'rgba(100, 100, 100, 0.1)' },
  },
};
