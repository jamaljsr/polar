import log from 'electron-log';
import BitcoinCore from 'bitcoin-core';
import { createBitcoindNetworkNode } from 'utils/network';
import { getNetwork } from 'utils/tests';
import bitcoindService from './bitcoindService';

jest.mock('bitcoin-core');
const mockBitcoin = (BitcoinCore as unknown) as jest.Mock<BitcoinCore>;

describe('BitcoindService', () => {
  const network = getNetwork();
  network.nodes.bitcoin.push(createBitcoindNetworkNode(network, '0.18.1'));
  const node = network.nodes.bitcoin[0];
  const mockProto = BitcoinCore.prototype;
  // helper func to get the first instance created during the test
  const getInst = () => mockBitcoin.mock.instances[0];

  beforeEach(() => {
    // update the prototype of new classes to specify the return values
    mockProto.getBlockchainInfo = jest.fn().mockResolvedValue({ blocks: 10 });
    mockProto.getWalletInfo = jest.fn().mockResolvedValue({ balance: 5 });
    mockProto.getNewAddress = jest.fn().mockResolvedValue('abcdef');
    mockProto.sendToAddress = jest.fn().mockResolvedValue('txid');
    mockProto.generateToAddress = jest.fn().mockResolvedValue(['blockhash1']);
  });

  it('should get blockchain info', async () => {
    const info = await bitcoindService.getBlockchainInfo(node);
    expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    expect(info.blocks).toEqual(10);
  });

  it('should get wallet info', async () => {
    const info = await bitcoindService.getWalletInfo(node);
    expect(mockBitcoin.mock.instances[0].getWalletInfo).toBeCalledTimes(1);
    expect(info.balance).toEqual(5);
  });

  it('should connect peers', async () => {
    await bitcoindService.connectPeers(node);
    expect(mockBitcoin.mock.instances[0].addNode).toBeCalledTimes(1);
  });

  it('should not throw error if connect peers fails', async () => {
    mockProto.addNode = jest.fn().mockRejectedValue('add-error');
    await bitcoindService.connectPeers(node);
    await expect(bitcoindService.connectPeers(node)).resolves.not.toThrow();
  });

  it('should mine new blocks', async () => {
    const result = await bitcoindService.mine(2, node);
    expect(getInst().getNewAddress).toBeCalledTimes(1);
    expect(getInst().generateToAddress).toBeCalledTimes(1);
    expect(getInst().generateToAddress).toBeCalledWith(2, 'abcdef');
    expect(result[0]).toEqual('blockhash1');
  });

  it('should reformat logs for rpc requests', async () => {
    const spy = jest.spyOn(log, 'debug');
    mockBitcoin.mockImplementationOnce(options => {
      options.logger.debug({ request: { body: '{}' } }, 'Making request...');
      return mockProto;
    });
    await bitcoindService.getBlockchainInfo(node);
    expect(spy).toBeCalledWith('BitcoindService: [request]', '{}');
  });

  it('should reformat logs for rpc responses', async () => {
    const spy = jest.spyOn(log, 'debug');
    mockBitcoin.mockImplementationOnce(options => {
      options.logger.debug({ request: { body: '{}' } }, 'Received response...');
      return mockProto;
    });
    await bitcoindService.getBlockchainInfo(node);
    expect(spy).toBeCalledWith('BitcoindService: [response]', '{}');
  });

  describe('sendFunds', () => {
    it('should send funds with sufficient balance', async () => {
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 1);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 1);
      expect(txid).toEqual('txid');
    });

    it('should send funds with insufficient balance', async () => {
      mockProto.getWalletInfo = jest.fn().mockResolvedValue({ balance: 0 });
      mockProto.listTransactions = jest.fn().mockResolvedValue([]);
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 10);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 10);
      expect(txid).toEqual('txid');
    });

    it('should send funds with sufficient balance above maturity height', async () => {
      mockProto.getBlockchainInfo = jest.fn().mockResolvedValue({ blocks: 110 });
      mockProto.getWalletInfo = jest.fn().mockResolvedValue({ balance: 0 });
      mockProto.listTransactions = jest.fn().mockResolvedValue([{ confirmations: 101 }]);
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 100);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 100);
      expect(txid).toEqual('txid');
    });

    it('should send funds with insufficient balance above maturity height', async () => {
      mockProto.getBlockchainInfo = jest.fn().mockResolvedValue({ blocks: 110 });
      mockProto.getWalletInfo = jest.fn().mockResolvedValue({ balance: 0 });
      mockProto.listTransactions = jest.fn().mockResolvedValue([{ confirmations: 10 }]);
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 10);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 10);
      expect(txid).toEqual('txid');
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      await expect(bitcoindService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      mockProto.getBlockchainInfo = jest.fn().mockRejectedValue(new Error('test-error'));
      await expect(bitcoindService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    });
  });
});
