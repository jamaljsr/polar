import BitcoinCore from 'bitcoin-core';
import { BitcoinNode } from 'shared/types';
import { BitcoinCoreClient } from 'types/bitcoin-core';
import { createBitcoindNetworkNode, createBtcdNetworkNode } from 'utils/network';
import { getNetwork, testNodeDocker } from 'utils/tests';
import BitcoinFactory from './bitcoinFactory';
import * as btcdApi from './btcd/btcdApi';

jest.mock('bitcoin-core');
jest.mock('./btcd/btcdApi');

const mockBitcoinCore = BitcoinCore as jest.MockedClass<typeof BitcoinCore>;
const mockBtcdApi = btcdApi as jest.Mocked<typeof btcdApi>;
const mockProto = BitcoinCore.prototype as unknown as BitcoinCoreClient;

describe('BitcoinFactory', () => {
  const network = getNetwork();
  const factory = new BitcoinFactory();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a working bitcoind service', async () => {
    const bitcoindNode = createBitcoindNetworkNode(network, '27.0', testNodeDocker);
    mockProto.getBlockchainInfo = jest.fn().mockResolvedValue({
      chain: 'regtest',
      blocks: 100,
    });

    const service = factory.getService(bitcoindNode);
    const info = await service.getBlockchainInfo(bitcoindNode);

    expect(mockBitcoinCore).toHaveBeenCalled();
    expect(info.blocks).toBe(100);
  });

  it('should return a working btcd service', async () => {
    const btcdNode = createBtcdNetworkNode(network, '0.25.0', testNodeDocker);
    mockBtcdApi.httpPost.mockResolvedValue({
      result: {
        chain: 'regtest',
        blocks: 50,
        headers: 50,
        bestblockhash: 'abc123',
        difficulty: 1,
        mediantime: 1234567890,
        pruned: false,
        bip9_softforks: {},
      },
      error: null,
      id: '1',
    });

    const service = factory.getService(btcdNode);
    const info = await service.getBlockchainInfo(btcdNode);

    expect(mockBtcdApi.httpPost).toHaveBeenCalled();
    expect(info.blocks).toBe(50);
  });

  it('should return correct service based on implementation', () => {
    const bitcoindNode: BitcoinNode = {
      id: 0,
      networkId: 1,
      name: 'bitcoind-1',
      type: 'bitcoin',
      implementation: 'bitcoind',
      version: '27.0',
      peers: [],
      status: 0,
      ports: { rpc: 18443, p2p: 19444, zmqBlock: 28332, zmqTx: 28333 },
      docker: testNodeDocker,
    };

    const btcdNode: BitcoinNode = {
      id: 1,
      networkId: 1,
      name: 'btcd-1',
      type: 'bitcoin',
      implementation: 'btcd',
      version: '0.25.0',
      peers: [],
      status: 0,
      ports: { grpc: 18334, p2p: 18444, btcdWallet: 18332 },
      docker: testNodeDocker,
    };

    const bitcoindService = factory.getService(bitcoindNode);
    const btcdService = factory.getService(btcdNode);

    // Verify they are different service instances
    expect(bitcoindService).not.toBe(btcdService);
  });
});
