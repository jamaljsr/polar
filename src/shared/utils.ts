import { app, remote } from 'electron';
import log from 'electron-log';
import { join } from 'path';
import http from 'http';
import https from 'https';

/**
 * setup logging to store log files in ~/.polar/logs/ dir
 */
export const initLogger = () => {
  log.transports.file.resolvePath = (variables: log.PathVariables) => {
    const ap = app || remote.app;
    return join(ap.getPath('home'), '.polar', 'logs', variables.fileName as string);
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
