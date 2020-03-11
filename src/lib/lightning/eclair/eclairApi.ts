import { ipcChannels } from 'shared';
import { EclairNode } from 'shared/types';
import { createIpcSender } from 'lib/ipc/ipcService';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const ipc = createIpcSender('EclairApi', 'app');

/**
 * Encodes a JS object into a form-urlencoded string
 * @param body the JS object to encode
 */
const encodeBody = (body?: any) => {
  if (body) {
    return Object.keys(body)
      .map(key => `${key}=${body[key]}`)
      .join('&');
  }
};

const request = async <T>(
  node: EclairNode,
  method: HttpMethod,
  path: string,
  body?: object,
): Promise<T> => {
  const args = {
    url: `http://127.0.0.1:${node.ports.rest}/${path}`,
    method,
    body: encodeBody(body),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${new Buffer(':eclairpw').toString('base64')}`,
    },
  };
  // debug(`eclair API: [request] ${node.name} '${args.url}' ${args.body || ''}`);
  const res = await ipc(ipcChannels.http, args);
  // debug(`eclair API: [response] ${node.name} ${JSON.stringify(res, null, 2)}`);

  return res as T;
};

export const httpPost = async <T>(
  node: EclairNode,
  path: string,
  body?: object,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};
