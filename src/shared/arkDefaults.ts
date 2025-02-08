// import * as ARK from '@lightningpolar/ark-api';
import { default as ipcChannels } from './ipcChannels';

export const defaultArkInfo = (value: Partial<any>): any => ({
  ...value,
});

const defaults = {
  [ipcChannels.ark.getInfo]: defaultArkInfo,
};

export type ArkDefaultsKey = keyof typeof defaults;
