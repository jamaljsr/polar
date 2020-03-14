import { ipcChannels } from 'shared';
import { EclairNode } from 'shared/types';
import { createIpcSender } from 'lib/ipc/ipcService';
import { eclairCredentials } from 'utils/constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const ipc = createIpcSender('EclairApi', 'app');

const request = async <T>(
  node: EclairNode,
  method: HttpMethod,
  path: string,
  body?: object,
): Promise<T> => {
  // there is no username for Ecalir API so left of the colon is blank
  const base64auth = new Buffer(`:${eclairCredentials.pass}`).toString('base64');
  const args = {
    url: `http://127.0.0.1:${node.ports.rest}/${path}`,
    method,
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${base64auth}`,
    },
  };
  const res = await ipc(ipcChannels.http, args);
  return res as T;
};

export const httpPost = async <T>(
  node: EclairNode,
  path: string,
  body?: object,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};
