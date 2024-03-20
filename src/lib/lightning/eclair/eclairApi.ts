import EclairTs from 'eclair-ts';
import { Options } from 'eclair-ts/src/types/config';
import { EclairWebSocket } from 'eclair-ts/dist/types/network';
import { ipcChannels } from 'shared';
import { EclairNode, LightningNode } from 'shared/types';
import { createIpcSender } from 'lib/ipc/ipcService';
import { eclairCredentials } from 'utils/constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const request = async <T>(
  node: LightningNode,
  method: HttpMethod,
  path: string,
  body?: any,
): Promise<T> => {
  if (node.implementation !== 'eclair')
    throw new Error(`EclairService cannot be used for '${node.implementation}' nodes`);

  // there is no username for Ecalir API so left of the colon is blank
  const base64auth = Buffer.from(`:${eclairCredentials.pass}`).toString('base64');
  const args = {
    url: `http://127.0.0.1:${node.ports.rest}/${path}`,
    method,
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${base64auth}`,
    },
  };
  const ipc = createIpcSender('EclairApi', 'app');
  const res = await ipc<any>(ipcChannels.http, args);

  if (res.error) throw new Error(res.error);

  return res as T;
};

export const httpPost = async <T>(
  node: LightningNode,
  path: string,
  body?: any,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};

const setupConfig = (eclairNode: EclairNode): Options => {
  const base64auth = Buffer.from(`:${eclairCredentials.pass}`).toString('base64');
  const config = {
    url: `127.0.0.1:${eclairNode.ports.rest}`,
    headers: {
      Authorization: `Basic ${base64auth}`,
    },
  };
  return config;
};

export const setupListener = (eclairNode: EclairNode): EclairWebSocket => {
  const eclairConfig = setupConfig(eclairNode);
  const eclairTs = new EclairTs(eclairConfig);
  const listener = eclairTs.listen();
  return listener;
};
