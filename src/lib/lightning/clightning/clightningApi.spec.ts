import fs from 'fs-extra';
import { CLightningNode } from 'shared/types';
import * as utils from 'shared/utils';
import { getNetwork } from 'utils/tests';
import { httpDelete, httpGet, httpPost } from './clightningApi';

jest.mock('fs-extra');
jest.mock('shared/utils');

const fsMock = fs as jest.Mocked<typeof fs>;
const utilsMock = utils as jest.Mocked<typeof utils>;

describe('CLightningApi', () => {
  const node = getNetwork().nodes.lightning[1] as CLightningNode;

  beforeEach(() => {
    fsMock.readFile.mockResolvedValue(Buffer.from('rune-content'));
  });

  it('should perform a successful httpGet', async () => {
    utilsMock.httpRequest.mockResolvedValue('{ "success": true }');
    const res = await httpGet(node, 'get-ok');
    expect(res).toEqual({ success: true });
  });

  it('should throw an error for an incorrect node implementation', async () => {
    const lnd = getNetwork().nodes.lightning[0];
    await expect(httpGet(lnd, 'get-ok')).rejects.toThrow(
      "ClightningService cannot be used for 'LND' nodes",
    );
  });

  it('should perform an unsuccessful httpGet', async () => {
    const res = {
      error: {
        code: 123,
        message: 'api-error',
      },
    };
    utilsMock.httpRequest.mockResolvedValue(JSON.stringify(res));
    await expect(httpGet(node, 'get-err')).rejects.toThrow('lightningd 123: api-error');
  });

  it('should perform a successful httpPost', async () => {
    let url = '';
    let options: utils.HttpRequestOptions = {};
    utilsMock.httpRequest.mockImplementation((u, o) => {
      url = u;
      options = o as utils.HttpRequestOptions;
      return Promise.resolve('{ "success": true }');
    });

    const res = await httpPost(node, 'post-ok', { data: 'asdf' });
    expect(res).toEqual({ success: true });
    expect(url).toEqual(`http://127.0.0.1:${node.ports.rest}/v1/post-ok`);
    expect(options).toEqual({
      body: '{"data":"asdf"}',
      headers: {
        'Content-Type': 'application/json',
        rune: 'rune-content',
      },
      method: 'POST',
    });
  });

  it('should perform a successful httpDelete', async () => {
    utilsMock.httpRequest.mockResolvedValue('{ "success": true }');
    const res = await httpDelete(node, 'delete-ok');
    expect(res).toEqual({ success: true });
  });
});
