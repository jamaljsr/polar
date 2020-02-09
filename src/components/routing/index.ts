export { default as Switch } from './Switch';
export { default as Routes } from './Routes';

export const HOME = '/';
export const NETWORK_NEW = '/network';
export const NETWORK_VIEW = (id: number | string) => `/network/${id}`;
export const NODES_VIEW = '/nodes';
export const TERMINAL = (type: number | string, name: number | string) =>
  `/terminal/${type}/${name}`;
