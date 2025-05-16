import { debug } from 'electron-log';
import { httpRequest } from 'shared/utils';
import { snakeKeysToCamel } from 'utils/objects';
import { BitcoinNode, BtcdNode } from 'shared/types';
import { btcdCredentials } from 'utils/constants';

interface ConfigOptions {
  url: string;
  headers: {
    Authorization: string;
    'Content-Type': string;
  };
  rejectUnauthorized?: boolean;
}

const request = async <T>(
  node: BitcoinNode,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  bodyObj?: any,
): Promise<T> => {
  const id = Math.round(Math.random() * Date.now());
  try {
    if (node.implementation !== 'btcd')
      throw new Error(`BtcdService cannot be used for '${node.implementation}' nodes`);

    const btcd = node as BtcdNode;

    const config = await setupConfig(btcd);
    const url = config.url;

    // add id to body if it exists
    const body = bodyObj ? { ...bodyObj, id } : undefined;

    const bodyStr = body ? JSON.stringify(body) : undefined;
    debug(`btcd API: [request] ${btcd.name} ${id} "${url}" ${bodyStr || ''}`);

    const response = await httpRequest(url, {
      method,
      headers: config.headers,
      body: bodyStr,
      rejectUnauthorized: config.rejectUnauthorized, // allow self-signed certs.
    });

    const json = JSON.parse(response);
    debug(`btcd API: [response] ${btcd.name} ${id} ${JSON.stringify(json, null, 2)}`);

    if (json.error) {
      throw new Error(json.error);
    }

    return snakeKeysToCamel(json) as T;
  } catch (error) {
    debug(`btcd API: [error] ${node.name} ${id} ${JSON.stringify(error)}`);
    throw error;
  }
};

export const httpPost = async <T>(node: BitcoinNode, body?: any): Promise<T> => {
  return request<T>(node, 'POST', body);
};

const setupConfig = async (btcd: BtcdNode): Promise<ConfigOptions> => {
  const auth = Buffer.from(`${btcdCredentials.user}:${btcdCredentials.pass}`).toString(
    'base64',
  );
  const config = {
    url: `https://127.0.0.1:${btcd.ports.btcdWallet}`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    rejectUnauthorized: false,
  };
  return config;
};
