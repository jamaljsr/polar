import { debug } from 'electron-log';
import { CLightningNode } from 'shared/types';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const request = async <T>(
  node: CLightningNode,
  method: HttpMethod,
  path: string,
  body?: object,
): Promise<T> => {
  const id = Math.round(Math.random() * Date.now());
  const url = `http://127.0.0.1:${node.ports.rest}/v1/${path}`;
  debug(`c-lightning API: [request] ${id} "${url}" ${body ? JSON.stringify(body) : ''}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      macaroon: await read(node.paths.macaroon, 'base64'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  debug(`c-lightning API: [response] ${id} ${JSON.stringify(json, null, 2)}`);

  if (!response.ok && typeof json.error === 'object') {
    const { code, message } = json.error;
    throw new Error(`lightningd ${code}: ${message}`);
  }

  return snakeKeysToCamel(json) as T;
};

export const httpGet = async <T>(node: CLightningNode, path: string): Promise<T> => {
  return request<T>(node, 'GET', path);
};

export const httpPost = async <T>(
  node: CLightningNode,
  path: string,
  body: object,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};

export const httpDelete = async <T>(node: CLightningNode, path: string): Promise<T> => {
  return request<T>(node, 'DELETE', path);
};
