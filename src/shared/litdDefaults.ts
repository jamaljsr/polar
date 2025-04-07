import * as LITD from '@lightningpolar/litd-api';
import ipcChannels from './ipcChannels';

const mapArray = <T>(arr: T[], func: (value: T) => T) => (arr || []).map(func);

export const defaultLitdStatus = (
  value: Partial<LITD.SubServerStatusResp>,
): LITD.SubServerStatusResp => ({
  subServers: {
    ...(value.subServers || {}),
  },
});

export const defaultLitdSession = (value: Partial<LITD.Session>): LITD.Session => ({
  id: Buffer.from(''),
  label: '',
  pairingSecret: Buffer.from(''),
  pairingSecretMnemonic: '',
  mailboxServerAddr: '',
  sessionState: LITD.SessionState.STATE_CREATED,
  sessionType: LITD.SessionType.TYPE_MACAROON_ADMIN,
  accountId: '',
  localPublicKey: Buffer.from(''),
  remotePublicKey: Buffer.from(''),
  createdAt: '0',
  expiryTimestampSeconds: '0',
  devServer: false,
  macaroonRecipe: null,
  autopilotFeatureInfo: {},
  featureConfigs: {},
  groupId: Buffer.from(''),
  revokedAt: '0',
  privacyFlags: '1',
  ...value,
});

export const defaultLitdListSessions = (
  value: Partial<LITD.ListSessionsResponse>,
): LITD.ListSessionsResponse => ({
  sessions: mapArray(value.sessions || [], defaultLitdSession),
});

const defaults = {
  [ipcChannels.litd.status]: defaultLitdStatus,
  [ipcChannels.litd.listSessions]: defaultLitdListSessions,
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
