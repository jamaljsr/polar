import { BtcdNode, Status } from 'shared/types';
import { httpRequest } from 'shared/utils';
import { httpPost } from './btcdApi';

jest.mock('shared/utils', () => ({
  httpRequest: jest.fn(),
}));

const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

describe('BtcdApi', () => {
  const btcdNode: BtcdNode = {
    id: 0,
    networkId: 1,
    name: 'btcd-1',
    type: 'bitcoin',
    implementation: 'btcd',
    version: '0.25.0',
    peers: [],
    status: Status.Started,
    ports: {
      grpc: 18334,
      p2p: 18444,
      btcdWallet: 18332,
    },
    docker: { image: '', command: '' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('httpPost', () => {
    it('should make a POST request with correct URL and headers', async () => {
      const mockResponse = JSON.stringify({ result: 'success', error: null });
      mockHttpRequest.mockResolvedValue(mockResponse);

      const body = { jsonrpc: '1.0', method: 'getinfo', params: [] };
      await httpPost(btcdNode, body);

      expect(mockHttpRequest).toHaveBeenCalledTimes(1);
      const [url, options] = mockHttpRequest.mock.calls[0];

      expect(url).toBe('https://127.0.0.1:18332');
      expect(options?.method).toBe('POST');
      expect(options?.headers?.['Content-Type']).toBe('application/json');
      expect(options?.rejectUnauthorized).toBe(false);
    });

    it('should include Basic auth header', async () => {
      const mockResponse = JSON.stringify({ result: 'success', error: null });
      mockHttpRequest.mockResolvedValue(mockResponse);

      await httpPost(btcdNode, { jsonrpc: '1.0', method: 'test', params: [] });

      const [, options] = mockHttpRequest.mock.calls[0];
      const authHeader = options?.headers?.Authorization as string;

      expect(authHeader).toMatch(/^Basic /);
      // Decode and verify credentials (polaruser:polarpass)
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toBe('polaruser:polarpass');
    });

    it('should add id to request body', async () => {
      const mockResponse = JSON.stringify({ result: 'success', error: null, id: 123 });
      mockHttpRequest.mockResolvedValue(mockResponse);

      const body = { jsonrpc: '1.0', method: 'getinfo', params: [] };
      await httpPost(btcdNode, body);

      const [, options] = mockHttpRequest.mock.calls[0];
      const requestBody = JSON.parse(options?.body || '{}');

      expect(requestBody.id).toBeDefined();
      expect(typeof requestBody.id).toBe('number');
      expect(requestBody.jsonrpc).toBe('1.0');
      expect(requestBody.method).toBe('getinfo');
    });

    it('should parse JSON response and convert snake_case to camelCase', async () => {
      const mockResponse = JSON.stringify({
        result: { block_count: 100, best_block_hash: 'abc123' },
        error: null,
      });
      mockHttpRequest.mockResolvedValue(mockResponse);

      const result = await httpPost<{
        result: { blockCount: number; bestBlockHash: string };
      }>(btcdNode, { jsonrpc: '1.0', method: 'test', params: [] });

      expect(result.result.blockCount).toBe(100);
      expect(result.result.bestBlockHash).toBe('abc123');
    });

    it('should throw error for non-btcd nodes', async () => {
      const bitcoindNode = {
        ...btcdNode,
        implementation: 'bitcoind' as const,
      };

      await expect(
        httpPost(bitcoindNode, { jsonrpc: '1.0', method: 'test', params: [] }),
      ).rejects.toThrow("BtcdService cannot be used for 'bitcoind' nodes");

      expect(mockHttpRequest).not.toHaveBeenCalled();
    });

    it('should throw error if response contains error', async () => {
      const mockResponse = JSON.stringify({
        result: null,
        error: { code: -1, message: 'RPC error' },
      });
      mockHttpRequest.mockResolvedValue(mockResponse);

      await expect(
        httpPost(btcdNode, { jsonrpc: '1.0', method: 'test', params: [] }),
      ).rejects.toThrow();
    });

    it('should throw error if httpRequest fails', async () => {
      mockHttpRequest.mockRejectedValue(new Error('Network error'));

      await expect(
        httpPost(btcdNode, { jsonrpc: '1.0', method: 'test', params: [] }),
      ).rejects.toThrow('Network error');
    });
  });
});
