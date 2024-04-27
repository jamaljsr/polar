import { ipcChannels } from 'shared';
import { EclairNode, LightningNode } from 'shared/types';
import WebSocket from 'ws';
import { createIpcSender } from 'lib/ipc/ipcService';
import { eclairCredentials } from 'utils/constants';
import * as ELN from './types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const request = async <T>(
  node: LightningNode,
  method: HttpMethod,
  path: string,
  body?: any,
): Promise<T> => {
  if (node.implementation !== 'eclair')
    throw new Error(`EclairService cannot be used for '${node.implementation}' nodes`);

  const config = setupConfig(node as EclairNode);
  const args = {
    url: `http://${config.url}/${path}`,
    method,
    body,
    headers: {
      ...config.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
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

const setupConfig = (eclairNode: EclairNode): ELN.ConfigOptions => {
  const base64auth = Buffer.from(`:${eclairCredentials.pass}`).toString('base64');
  const config = {
    url: `127.0.0.1:${eclairNode.ports.rest}`,
    headers: {
      Authorization: `Basic ${base64auth}`,
    },
  };
  return config;
};

const listenerCache: {
  [key: number]: ELN.EclairWebSocket;
} = {};

export const getListener = (eclairNode: EclairNode): ELN.EclairWebSocket => {
  const nodePort = getNodePort(eclairNode);
  if (!listenerCache[nodePort]) {
    listenerCache[nodePort] = setupListener(eclairNode);
  }
  return listenerCache[nodePort];
};

export const removeListener = (node: LightningNode): void => {
  const nodePort = getNodePort(node);
  if (listenerCache[nodePort]) {
    listenerCache[nodePort].close();
    delete listenerCache[nodePort];
  }
};

export const clearListeners = () => {
  Object.keys(listenerCache).forEach(key => {
    const port = parseInt(key);
    listenerCache[port].close();
    delete listenerCache[port];
  });
};

export const setupListener = (eclairNode: EclairNode): ELN.EclairWebSocket => {
  const nodePort = getNodePort(eclairNode);
  const eclairConfig = setupConfig(eclairNode);
  listenerCache[nodePort] = listen(eclairConfig);
  return listenerCache[nodePort];
};

const listen = (options: ELN.ConfigOptions): ELN.EclairWebSocket => {
  const { url, headers } = options;
  const socket = new WebSocket(`ws://${url}/ws`, { headers });
  // ping every 50s to keep it alive
  setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.ping();
    }
  }, 50e3);
  return socket;
};

const getNodePort = (node: LightningNode): number => {
  return (node as EclairNode).ports.rest;
};
