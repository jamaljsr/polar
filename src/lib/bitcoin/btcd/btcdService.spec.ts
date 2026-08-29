import { BtcdNode, Status } from 'shared/types';
import { testNodeDocker } from 'utils/tests';
import btcdService from './btcdService';
import * as btcdApi from './btcdApi';
import * as BTCD from './types';

jest.mock('./btcdApi');
jest.mock('utils/async', () => ({
  ...jest.requireActual('utils/async'),
  delay: jest.fn().mockResolvedValue(undefined),
}));
const mockHttpPost = btcdApi.httpPost as jest.MockedFunction<typeof btcdApi.httpPost>;

describe('BtcdService', () => {
  // Create a btcd node directly instead of using getNetwork which creates bitcoind nodes
  const node: BtcdNode = {
    id: 0,
    networkId: 1,
    name: 'btcd-1',
    type: 'bitcoin',
    implementation: 'btcd',
    version: '0.26.0',
    peers: [],
    status: Status.Started,
    ports: {
      rpc: 18334,
      p2p: 18444,
      btcdWallet: 18332,
    },
    docker: testNodeDocker,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDefaultWallet', () => {
    it('should unlock the default wallet and set a mining address', async () => {
      const testNode = { ...node, miningAddr: undefined };
      mockHttpPost
        .mockResolvedValueOnce({ result: null }) // walletpassphrase
        .mockResolvedValueOnce({ result: 'bcrt1qtest123' }); // getnewaddress
      await btcdService.createDefaultWallet(testNode);
      expect(mockHttpPost).toHaveBeenCalledTimes(2);
      expect(mockHttpPost).toHaveBeenNthCalledWith(1, testNode, {
        jsonrpc: '1.0',
        method: 'walletpassphrase',
        params: ['polarpass', 0],
      });
      expect(mockHttpPost).toHaveBeenNthCalledWith(2, testNode, {
        jsonrpc: '1.0',
        method: 'getnewaddress',
        params: ['default', 'bech32'],
      });
      expect(testNode.miningAddr).toEqual('bcrt1qtest123');
    });

    it('should not fetch a new address if miningAddr is already set', async () => {
      const testNode = { ...node, miningAddr: 'bcrt1qexisting' };
      mockHttpPost.mockResolvedValueOnce({ result: null }); // walletpassphrase
      await btcdService.createDefaultWallet(testNode);
      expect(mockHttpPost).toHaveBeenCalledTimes(1);
      expect(testNode.miningAddr).toEqual('bcrt1qexisting');
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
      // getinfo
      mockHttpPost.mockResolvedValueOnce({
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
      } as BTCD.GetInfoResponse);
      // getreceivedbyaccount
      mockHttpPost.mockResolvedValueOnce({
        jsonrpc: '1.0',
        result: 75.0,
        error: null,
        id: '2',
      } as BTCD.GetTotalReceivedByAccountResponse);
      // listunspent [0, 0] for unconfirmed balance
      mockHttpPost.mockResolvedValueOnce({
        jsonrpc: '1.0',
        result: [
          {
            txid: 'abc',
            vout: 0,
            address: 'addr',
            account: 'default',
            scriptPubKey: 'script',
            amount: 5.5,
            confirmations: 0,
          },
        ],
        error: null,
        id: '3',
      } as BTCD.ListUnspentResponse);

      const info = await btcdService.getWalletInfo(node);

      expect(mockHttpPost).toHaveBeenCalledTimes(3);
      expect(mockHttpPost).toHaveBeenNthCalledWith(1, node, {
        jsonrpc: '1.0',
        method: 'getinfo',
        params: [],
      });
      expect(info.balance).toEqual(50.5);
      expect(info.unconfirmed_balance).toEqual(5.5);
      expect(info.immature_balance).toBeCloseTo(75.0 - 50.5);
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
    // helper to set up the 3 mocks that getWalletInfo needs
    const mockGetWalletInfo = (balance: number) => {
      mockHttpPost.mockResolvedValueOnce({
        result: { balance },
      } as unknown as BTCD.GetInfoResponse);
      mockHttpPost.mockResolvedValueOnce({
        result: 0,
      } as unknown as BTCD.GetTotalReceivedByAccountResponse);
      mockHttpPost.mockResolvedValueOnce({
        result: [],
      } as unknown as BTCD.ListUnspentResponse);
    };

    it('should send funds with sufficient balance', async () => {
      // getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 200, headers: 200 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // getWalletInfo (3 calls: getinfo, getreceivedbyaccount, listunspent)
      mockGetWalletInfo(100);
      // sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid123',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 10);

      expect(txid).toEqual('txid123');
      // getblockchaininfo + 3x getWalletInfo + sendtoaddress = 5
      expect(mockHttpPost).toHaveBeenCalledTimes(5);
      expect(mockHttpPost).toHaveBeenLastCalledWith(node, {
        jsonrpc: '1.0',
        method: 'sendtoaddress',
        params: ['destaddr', 10],
      });
    });

    it('should mine blocks when balance is insufficient', async () => {
      // getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 200, headers: 200 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // getWalletInfo (balance=5, insufficient for amount=50)
      mockGetWalletInfo(5);
      // mineUntilMaturity: listunspent - confs=101 so neededConfs=0, no generate
      mockHttpPost.mockResolvedValueOnce({
        result: [{ confirmations: 101 }],
      } as unknown as BTCD.ListUnspentResponse);
      // mine for getBlocksToMine
      mockHttpPost.mockResolvedValueOnce({ result: ['blockhash'] });
      // sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid456',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 50);

      expect(txid).toEqual('txid456');
      // getblockchaininfo + 3x getWalletInfo + listunspent + generate + sendtoaddress = 7
      expect(mockHttpPost).toHaveBeenCalledTimes(7);
    });

    it('should mine to maturity when utxos are immature', async () => {
      // getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 10, headers: 10 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // getWalletInfo (balance=0, insufficient)
      mockGetWalletInfo(0);
      // mineUntilMaturity: listunspent - confs=0, neededConfs=100
      mockHttpPost.mockResolvedValueOnce({
        result: [{ confirmations: 0 }],
      } as unknown as BTCD.ListUnspentResponse);
      // generate 100 blocks for maturity
      mockHttpPost.mockResolvedValueOnce({ result: [] });
      // mine for getBlocksToMine
      mockHttpPost.mockResolvedValueOnce({ result: [] });
      // sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txid789',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 10);

      expect(txid).toEqual('txid789');
      // getblockchaininfo + 3x getWalletInfo + listunspent + 2x generate + sendtoaddress = 8
      expect(mockHttpPost).toHaveBeenCalledTimes(8);
    });

    it('should skip mining to maturity when utxos have enough confirmations', async () => {
      // getBlockchainInfo
      mockHttpPost.mockResolvedValueOnce({
        result: { chain: 'regtest', blocks: 200, headers: 200 },
      } as unknown as BTCD.GetBlockchainInfoResponse);
      // getWalletInfo (balance=5, insufficient for amount=50)
      mockGetWalletInfo(5);
      // mineUntilMaturity: listunspent - max confs=100, neededConfs=0, no generate
      mockHttpPost.mockResolvedValueOnce({
        result: [{ confirmations: 50 }, { confirmations: 100 }],
      } as unknown as BTCD.ListUnspentResponse);
      // mine for getBlocksToMine
      mockHttpPost.mockResolvedValueOnce({ result: ['blockhash'] });
      // sendtoaddress
      mockHttpPost.mockResolvedValueOnce({
        result: 'txidNoMaturity',
      } as unknown as BTCD.SendToAddressResponse);

      const txid = await btcdService.sendFunds(node, 'destaddr', 50);

      expect(txid).toEqual('txidNoMaturity');
      // getblockchaininfo + 3x getWalletInfo + listunspent + generate + sendtoaddress = 7
      expect(mockHttpPost).toHaveBeenCalledTimes(7);
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
