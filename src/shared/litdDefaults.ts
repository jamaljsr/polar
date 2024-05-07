import * as LITD from '@lightningpolar/litd-api';
import ipcChannels from './ipcChannels';

export const defaultStatus = (
  value: Partial<LITD.SubServerStatusResp>,
): LITD.SubServerStatusResp => ({
  subServers: {
    ...(value.subServers || {}),
  },
});

const defaults = {
  [ipcChannels.litd.status]: defaultStatus,
};

export type LitdDefaultsKey = keyof typeof defaults;

/**
 * The tapd API will omit falsey values in responses. This function will ensure the response
 * has sensible default values for each property of the response
 * @param values the actual values received from the tapd API
 * @param key the key of the defaults object containing the default values for the response
 */
export const withLitdDefaults = (values: any, key: LitdDefaultsKey): any => {
  const func = defaults[key];
  return func ? func(values) : values;
};
