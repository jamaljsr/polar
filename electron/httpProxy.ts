import { URLSearchParams } from 'url';
import { httpRequest } from '../src/shared/utils';

const isJson = (headers: Record<string, string>): boolean => {
  const ct = headers['Content-Type'] || headers['content-type'] || '';
  return ct.toLowerCase().includes('application/json');
};

/**
 * Encodes a JS object into a form-urlencoded string
 * @param body the JS object to encode
 */
const encodeBody = (body?: any) => {
  if (body) {
    const params = new URLSearchParams();
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) params.append(key, body[key]);
    });
    return params.toString();
  }
};

export const httpProxy = async (args: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
}): Promise<any> => {
  const { url, method, body, headers } = args;

  let requestBody: string | undefined;
  if (body !== undefined) {
    if (isJson(headers)) {
      requestBody = JSON.stringify(body ?? {});
    } else {
      requestBody = encodeBody(body);
    }
  }
  if (requestBody !== undefined) {
    headers['Content-Length'] = Buffer.byteLength(requestBody).toString();
  }

  const response = await httpRequest(url, {
    method,
    headers,
    body: requestBody,
  });

  const json = JSON.parse(response);

  return json;
};
