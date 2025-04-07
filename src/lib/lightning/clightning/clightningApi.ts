import { debug } from 'electron-log';
import { CLightningNode, LightningNode } from 'shared/types';
import { httpRequest } from 'shared/utils';
import { io, Socket } from 'socket.io-client';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';

interface ConfigOptions {
  url: string;
  headers: {
    rune: string;
  };
}

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

  const config = await setupConfig(cln);
  const url = `${config.url}/v1/${path}`;
  const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
  debug(`c-lightning API: [request] ${cln.name} ${id} "${url}" ${body || ''}`);

  const response = await httpRequest(url, {
    method,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    body,
  });

  const json = JSON.parse(response);
  debug(`c-lightning API: [response] ${cln.name} ${id} ${JSON.stringify(json, null, 2)}`);

  if (json.code && json.message) {
    const { code, message } = json;
    throw new Error(`lightningd ${code}: ${message}`);
  }

  return snakeKeysToCamel(json) as T;
};

export const httpPost = async <T>(
  node: LightningNode,
  path: string,
  body?: any,
): Promise<T> => {
  return request<T>(node, 'POST', path, body);
};

const setupConfig = async (cln: CLightningNode): Promise<ConfigOptions> => {
  const rune = await read(cln.paths.rune, 'utf-8');
  const config = {
    url: `http://127.0.0.1:${cln.ports.rest}`,
    headers: {
      rune,
    },
  };
  return config;
};

const listenerCache: {
  [key: number]: Socket;
} = {};

export const getListener = async (node: CLightningNode): Promise<Socket> => {
  if (!listenerCache[node.ports.rest]) {
    listenerCache[node.ports.rest] = await setupListener(node);
  }
  return listenerCache[node.ports.rest];
};

export const removeListener = (node: CLightningNode): void => {
  if (listenerCache[node.ports.rest]) {
    listenerCache[node.ports.rest].disconnect();
    delete listenerCache[node.ports.rest];
  }
};

export const clearListeners = () => {
  Object.keys(listenerCache).forEach(key => {
    const port = parseInt(key);
    listenerCache[port].disconnect();
    delete listenerCache[port];
  });
};

export const setupListener = async (node: CLightningNode): Promise<Socket> => {
  const config = await setupConfig(node);
  listenerCache[node.ports.rest] = listen(config);
  return listenerCache[node.ports.rest];
};

const listen = (options: ConfigOptions): Socket => {
  const { url, headers } = options;
  const socket = io(url, { extraHeaders: headers });
  return socket;
};
