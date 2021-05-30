import { URLSearchParams } from 'url';
import { httpRequest } from '../src/shared/utils';

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

  const formBody = encodeBody(body);
  if (formBody) {
    headers['Content-Length'] = formBody.length.toString();
  }

  const response = await httpRequest(url, {
    method,
    headers,
    body: formBody,
  });

  const json = JSON.parse(response);

  return json;
};
