import { URLSearchParams } from 'url';
import { httpRequest } from '../src/shared/utils';

/**
 * Encodes a JS object into a form-urlencoded string
 * @param body the JS object to encode
 */
const encodeBody = (body?: any) => {
  if (body) {
    const params = new URLSearchParams();
    Object.keys(body).forEach(key => params.append(key, body[key]));
    return params.toString();
  }
};

export const httpProxy = async (args: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: object;
}): Promise<any> => {
  const { url, method, body, headers } = args;

  const response = await httpRequest(url, {
    method,
    headers,
    body: encodeBody(body),
  });

  const json = JSON.parse(response);

  return json;
};
