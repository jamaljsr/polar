import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

/**
 * Encodes a JS object into a form-urlencoded string
 * @param body the JS object to encode
 */
const encodeBody = (body?: any) => {
  if (body) {
    const params = new URLSearchParams();
    Object.keys(body).forEach(key => params.append(key, body[key]));
    return params;
  }
};

export const httpRequest = async (args: {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: object;
}): Promise<any> => {
  const { url, method, body, headers } = args;
  const response = await fetch(url, {
    method,
    headers,
    body: encodeBody(body),
  });

  const json = await response.json();

  if (!response.ok && typeof json.error === 'string') {
    throw new Error(json.error);
  }

  return json;
};
