export { default as Switch } from './Switch';
export { default as Routes } from './Routes';

export const HOME = '/';
export const NETWORK_NEW = '/network';
export const NETWORK_SETTING = '/network_setting';
export const NETWORK_IMPORT = '/network_import';
export const NETWORK_VIEW = (id: number | string) => `/network/${id}`;
export const NODE_IMAGES = '/nodes-images';
export const TERMINAL = (type: number | string, name: number | string) =>
  `/terminal/${type}/${name}`;
export const LOGS = (type: number | string, name: number | string) =>
  `/logs/${type}/${name}`;
