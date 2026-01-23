import { BtcdNode, Status } from 'shared/types';
import { testNodeDocker } from 'utils/tests';
import btcdService from './btcdService';
import * as btcdApi from './btcdApi';
import * as BTCD from './types';

jest.mock('./btcdApi');
const mockHttpPost = btcdApi.httpPost as jest.MockedFunction<typeof btcdApi.httpPost>;

describe('BtcdService', () => {
  // Create a btcd node directly instead of using getNetwork which creates bitcoind nodes
  const node: BtcdNode = {
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
    docker: testNodeDocker,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDefaultWallet', () => {
    it('should unlock the default wallet', async () => {
      mockHttpPost.mockResolvedValue({ result: null });
      await btcdService.createDefaultWallet(node);
      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(node, {
        jsonrpc: '1.0',
        method: 'walletpassphrase',
        params: ['polarpass', 0],
      });
    });
  });

  describe('getBlockchainInfo', () => {
    it('should get blockchain info', async () => {
      const mockResponse: BTCD.GetBlockchainInfoResponse = {
        jsonrpc: '1.0',
        result: {
          chain: 'regtest',
          blocks: 100,
          headers: 100,
          bestblockhash: 'blockhash123',
          difficulty: 1,
          mediantime: 1234567890,
          pruned: false,
          bip9_softforks: {},
        },
        error: null,
        id: '1',
      };
      mockHttpPost.mockResolvedValue(mockResponse);

      const info = await btcdService.getBlockchainInfo(node);

      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(node, {
        jsonrpc: '1.0',
        method: 'getblockchaininfo',
        params: [],
      });
      expect(info.blocks).toEqual(100);
      expect(info.chain).toEqual('regtest');
      expect(info.bestblockhash).toEqual('blockhash123');
    });
  });

  describe('getWalletInfo', () => {
    it('should get wallet info', async () => {
      const mockResponse: BTCD.GetInfoResponse = {
        jsonrpc: '1.0',
        result: {
          version: 160000,
          protocolversion: 70016,
          walletversion: 160000,
          balance: 50.5,
          blocks: 100,
          timeoffset: 0,
          connections: 2,
          proxy: '',
          difficulty: 1,
          testnet: false,
          keypoololdest: 1234567890,
          keypoolsize: 100,
          unlocked_until: 0,
          paytxfee: 0.0001,
          relayfee: 0.00001,
          errors: '',
        },
        error: null,
        id: '1',
      };
      mockHttpPost.mockResolvedValue(mockResponse);

      const info = await btcdService.getWalletInfo(node);

      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(node, {
        jsonrpc: '1.0',
        method: 'getinfo',
        params: [],
      });
      expect(info.balance).toEqual(50.5);
      expect(info.walletname).toEqual('default');
    });
  });

  describe('getNewAddress', () => {
    it('should get new address', async () => {
      const mockResponse: BTCD.GetNewAddressResponse = {
        jsonrpc: '1.0',
        result: 'bcrt1qabcdef123456',
        error: null,
        id: '1',
      };
      mockHttpPost.mockResolvedValue(mockResponse);

      const address = await btcdService.getNewAddress(node);

      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(node, {
        jsonrpc: '1.0',
        method: 'getnewaddress',
        params: ['default', 'bech32'],
      });
      expect(address).toEqual('bcrt1qabcdef123456');
    });
  });

  describe('connectPeers', () => {
    it('should connect peers', async () => {
      const nodeWithPeers = {
        ...node,
        peers: ['peer1', 'peer2'],
      };
      mockHttpPost.mockResolvedValue({ result: null });

      await btcdService.connectPeers(nodeWithPeers);

      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(mockHttpPost).toHaveBeenNthCalledWith(1, nodeWithPeers, {
        jsonrpc: '1.0',
        method: 'addnode',
        params: ['peer1', 'add'],
      });
      expect(mockHttpPost).toHaveBeenNthCalledWith(2, nodeWithPeers, {
        jsonrpc: '1.0',
        method: 'addnode',
        params: ['peer2', 'add'],
      });
    });

    it('should not throw error if connect peers fails', async () => {
      const nodeWithPeers = {
        ...node,
        peers: ['peer1'],
      };
      mockHttpPost.mockRejectedValue(new Error('connection failed'));

      await expect(btcdService.connectPeers(nodeWithPeers)).resolves.not.toThrow();
    });

    it('should do nothing if no peers', async () => {
      await btcdService.connectPeers(node);
      expect(mockHttpPost).not.toHaveBeenCalled();
    });
  });

  describe('mine', () => {
    it('should mine blocks', async () => {
      mockHttpPost.mockResolvedValue({ result: ['blockhash1', 'blockhash2'] });

      const result = await btcdService.mine(2, node);

      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(mockHttpPost).toHaveBeenCalledWith(node, {
        jsonrpc: '1.0',
        method: 'generate',
        params: [2],
      });
      expect(result).toEqual({ result: ['blockhash1', 'blockhash2'] });
    });
  });

  describe('sendFunds', () => {
    it('should send funds with sufficient balance', async () => {
      // Mock getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 200, headers: 200 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // Mock getWalletInfo (getinfo)
      mockHttpPost.mockResolvedValueOnce({
        result: { balance: 100 },
      } as unknown as BTCD.GetInfoResponse);
      // Mock sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid123',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 10);

      expect(txid).toEqual('txid123');
      // Should call getBlockchainInfo, getWalletInfo, sendtoaddress
      expect(mockHttpPost).toHaveBeenCalledTimes(3);
      expect(mockHttpPost).toHaveBeenLastCalledWith(node, {
        jsonrpc: '1.0',
        method: 'sendtoaddress',
        params: ['destaddr', 10],
      });
    });

    it('should mine blocks when balance is insufficient', async () => {
      // Mock getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 200, headers: 200 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // Mock getWalletInfo (getinfo) - insufficient balance
      mockHttpPost.mockResolvedValueOnce({
        result: { balance: 5 },
      } as unknown as BTCD.GetInfoResponse);
      // Mock listtransactions for mineUntilMaturity - no immature utxos
      // (confirmations > 0 means they won't be filtered, but filter is for === 0)
      mockHttpPost.mockResolvedValueOnce({
        result: [{ confirmations: 101 }],
      } as unknown as BTCD.ListTransactionsResponse);
      // Mock generate for mineUntilMaturity - since no utxos with confirmations === 0,
      // Math.max(0, ...[]) = 0, neededConfs = 100 - 0 = 100 blocks
      mockHttpPost.mockResolvedValueOnce({ result: [] });
      // Mock generate for getBlocksToMine
      mockHttpPost.mockResolvedValueOnce({ result: ['blockhash'] });
      // Mock sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid456',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 50);

      expect(txid).toEqual('txid456');
    }, 10000); // Increase timeout due to delay in mineUntilMaturity

    it('should mine to maturity when utxos are immature', async () => {
      // Mock getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 10, headers: 10 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // Mock getWalletInfo (getinfo) - insufficient balance
      mockHttpPost.mockResolvedValueOnce({
        result: { balance: 0 },
      } as unknown as BTCD.GetInfoResponse);
      // Mock listtransactions - utxos with 0 confirmations
      mockHttpPost.mockResolvedValueOnce({
        result: [{ confirmations: 0 }],
      } as unknown as BTCD.ListTransactionsResponse);
      // Mock generate for mineUntilMaturity (needs 100 blocks)
      mockHttpPost.mockResolvedValueOnce({ result: [] });
      // Mock generate for additional blocks
      mockHttpPost.mockResolvedValueOnce({ result: [] });
      // Mock sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid789',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 10);

      expect(txid).toEqual('txid789');
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      mockHttpPost.mockResolvedValue({
        result: { chain: 'regtest', blocks: 0 },
      } as unknown as BTCD.GetBlockchainInfoResponse);

      await expect(btcdService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(mockHttpPost).toHaveBeenCalled();
    });

    it('should throw error if waiting times out', async () => {
      mockHttpPost.mockRejectedValue(new Error('connection refused'));

      await expect(btcdService.waitUntilOnline(node, 100, 200)).rejects.toThrow();
    });
  });
});
