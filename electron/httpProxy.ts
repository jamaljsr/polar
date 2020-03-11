import fetch from 'node-fetch';

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
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok && typeof json.error === 'string') {
    throw new Error(json.error);
  }

  return json;
};
