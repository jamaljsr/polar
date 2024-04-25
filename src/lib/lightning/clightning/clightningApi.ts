import { debug } from 'electron-log';
import { CLightningNode, LightningNode } from 'shared/types';
import { httpRequest } from 'shared/utils';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';

const request = async <T>(
  node: LightningNode,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  bodyObj?: any,
): Promise<T> => {
  if (node.implementation !== 'c-lightning')
    throw new Error(
      `ClightningService cannot be used for '${node.implementation}' nodes`,
    );

  const cln = node as CLightningNode;
  const id = Math.round(Math.random() * Date.now());
  const url = `http://127.0.0.1:${cln.ports.rest}/v1/${path}`;
  const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
  const rune = await read(cln.paths.rune, 'utf-8');
  debug(`c-lightning API: [request] ${cln.name} ${id} "${url}" ${body || ''}`);

  const response = await httpRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      rune,
    },
    body,
  });

  const json = JSON.parse(response);
  debug(`c-lightning API: [response] ${cln.name} ${id} ${JSON.stringify(json, null, 2)}`);

  if (typeof json.error === 'object') {
    const { code, message } = json.error;
    throw new Error(`lightningd ${code}: ${message}`);
  }

  return snakeKeysToCamel(json) as T;
};

export const httpGet = async <T>(node: LightningNode, path: string): Promise<T> => {
  return request<T>(node, 'GET', path);
};

export const httpPost = async <T>(
  node: LightningNode,
  path: string,
  body?: any,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};

export const httpDelete = async <T>(node: LightningNode, path: string): Promise<T> => {
  return request<T>(node, 'DELETE', path);
};
