import { app, remote } from 'electron';
import log from 'electron-log';
import { existsSync } from 'fs';
import { join } from 'path';
import http from 'http';
import https from 'https';

/**
 * setup logging to store log files in ~/.polar/logs/ dir
 */
export const initLogger = () => {
  log.transports.file.resolvePath = (variables: log.PathVariables) => {
    const ap = app || remote.app;
    const home = ap.getPath('home');
    const xdgPath = join(home, '.local', 'share', 'polar');
    const dataPath = existsSync(xdgPath) ? xdgPath : join(home, '.polar');
    return join(dataPath, 'logs', variables.fileName as string);
  };
};

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, number | string | string[] | undefined>;
  body?: string;
}

const defaultOptions: HttpRequestOptions = {
  method: 'GET',
  headers: {},
};

/**
 * Makes an HTTP request using NodeJS's native http module
 */
export const httpRequest = (
  url: string,
  options?: HttpRequestOptions,
): Promise<string> => {
  const { method, headers, body } = Object.assign(defaultOptions, options);
  return new Promise((resolve, reject) => {
    const httpOptions = { method, headers };
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, httpOptions, res => {
      let data = '';
      // the http module returns data in chunks which need to be combined
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', err => {
      reject(err);
    });
    if (body) {
      req.write(body);
    }
    req.end();
  });
};

/**
 * Converts an object to a JSON string, but converts any Buffer arrays to hex strings
 */
export const toJSON = (data: any): string => {
  return JSON.stringify(
    data,
    (key, value) => {
      if (value?.type === 'Buffer') {
        return Buffer.from(value.data).toString('hex');
      } else if (value instanceof Uint8Array) {
        return Buffer.from(value).toString('hex');
      }
      return value;
    },
    2,
  );
};
