import fs from 'fs-extra';
import fetchMock from 'fetch-mock';
import { CLightningNode } from 'shared/types';
import { getNetwork } from 'utils/tests';
import { httpDelete, httpGet, httpPost } from './clightningApi';

jest.mock('fs-extra');

const fsMock = fs as jest.Mocked<typeof fs>;

describe('CLightningApi', () => {
  const node = getNetwork().nodes.lightning[1] as CLightningNode;

  beforeEach(() => {
    fsMock.readFile.mockResolvedValue(Buffer.from('macaroon-content'));
  });

  afterEach(fetchMock.resetHistory);

  it('should perform a successful httpGet', async () => {
    fetchMock.once('end:/get-ok', { success: true });
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
    fetchMock.once('end:/get-err', {
      status: 500,
      body: {
        error: {
          code: 123,
          message: 'api-error',
        },
      },
    });
    await expect(httpGet(node, 'get-err')).rejects.toThrow('lightningd 123: api-error');
  });

  it('should perform a successful httpPost', async () => {
    fetchMock.once('end:/post-ok', { success: true });
    const res = await httpPost(node, 'post-ok', { data: 'asdf' });
    expect(res).toEqual({ success: true });
    const lastCall = fetchMock.lastCall() as any;
    expect(lastCall).toBeInstanceOf(Array);
    expect(lastCall[1].body).toEqual('{"data":"asdf"}');
  });

  it('should perform a successful httpDelete', async () => {
    fetchMock.once('end:/delete-ok', { success: true });
    const res = await httpDelete(node, 'delete-ok');
    expect(res).toEqual({ success: true });
  });
});
