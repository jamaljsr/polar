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
  debug(`c-lightning API Request`);

  const url = `http://127.0.0.1:${node.ports.rest}/v1/${path}`;
  debug(` - url: ${url}`);
  if (body) debug(` - body: ${JSON.stringify(body, null, 2)}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      macaroon: await read(node.paths.macaroon, 'base64'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  debug(` - resp: ${JSON.stringify(json, null, 2)}`);

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
