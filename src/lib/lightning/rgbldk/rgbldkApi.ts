import { ipcChannels } from 'shared';
import { httpRequest } from 'shared/utils';
import { LightningNode } from 'shared/types';
import { createIpcSender } from 'lib/ipc/ipcService';

type HttpMethod = 'GET' | 'POST';

export const apiBaseUrl = (node: LightningNode): string => {
  const restPort = node.ports.rest;
  if (!restPort) throw new Error(`rgbldk node ${node.name} has no REST port configured`);
  return `http://127.0.0.1:${restPort}/api/v1`;
};

const request = async <T>(
  node: LightningNode,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> => {
  const url = `${apiBaseUrl(node)}${path.startsWith('/') ? '' : '/'}${path}`;
  const ipc = createIpcSender('RgbLdkApi', 'app');
  const args = {
    url,
    method,
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const res = await ipc<any>(ipcChannels.http, args);
  if (res?.error) throw new Error(res.error);
  return res as T;
};

export const httpGet = async <T>(node: LightningNode, path: string): Promise<T> => {
  return request<T>(node, 'GET', path);
};

export const httpPost = async <T>(
  node: LightningNode,
  path: string,
  body?: unknown,
): Promise<T> => {
  return request<T>(node, 'POST', path, body || {});
};

// For unit tests, allow a simpler, non-IPC fallback when needed.
export const httpGetDirect = async <T>(url: string): Promise<T> => {
  const text = await httpRequest(url);
  return JSON.parse(text) as T;
};
