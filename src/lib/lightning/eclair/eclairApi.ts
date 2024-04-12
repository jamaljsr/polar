import WebSocket from 'ws';
import { ipcChannels } from 'shared';
import { EclairNode, LightningNode } from 'shared/types';
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

export const getListener = (node: LightningNode): ELN.EclairWebSocket => {
  const nodePort = getNodePort(node);
  return listenerCache[nodePort];
};

export const setupListener = (eclairNode: EclairNode): ELN.EclairWebSocket => {
  const nodePort = getNodePort(eclairNode);
  const eclairConfig = setupConfig(eclairNode);
  listenerCache[nodePort] = listen(eclairConfig);
  return listenerCache[nodePort];
};

const listen = (options: ELN.ConfigOptions): ELN.EclairWebSocket => {
  const { url, headers } = options;
  const urlWithoutProtocol = stripProtocol(url);
  const socket = new WebSocket(`ws://${urlWithoutProtocol}/ws`, {
    headers,
  });
  // ping every 50s to keep it alive
  setInterval(() => {
    if (socket) {
      socket.ping();
    }
  }, 50e3);
  return socket;
};

const stripProtocol = (url: string): string => {
  return url.replace('https://', '').replace('http://', '');
};

const getNodePort = (node: LightningNode): number => {
  return (node as EclairNode).ports.rest;
};
