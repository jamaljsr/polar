import BitcoinCore from 'bitcoin-core';
import { getNetwork } from 'utils/tests';
import bitcoindService from './bitcoindService';

jest.mock('bitcoin-core');
const mockBitcoin = (BitcoinCore as unknown) as jest.Mock<BitcoinCore>;

describe('BitcoindService', () => {
  const node = getNetwork().nodes.bitcoin[0];
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
    const info = await bitcoindService.getBlockchainInfo();
    expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    expect(info.blocks).toEqual(10);
  });

  it('should get wallet info', async () => {
    const info = await bitcoindService.getWalletInfo();
    expect(mockBitcoin.mock.instances[0].getWalletInfo).toBeCalledTimes(1);
    expect(info.balance).toEqual(5);
  });

  it('should mine new blocks', async () => {
    const result = await bitcoindService.mine(2);
    expect(getInst().getNewAddress).toBeCalledTimes(1);
    expect(getInst().generateToAddress).toBeCalledTimes(1);
    expect(getInst().generateToAddress).toBeCalledWith(2, 'abcdef');
    expect(result[0]).toEqual('blockhash1');
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
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 10);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 10);
      expect(txid).toEqual('txid');
    });

    it('should send funds with insufficient balance above maturity height', async () => {
      mockProto.getBlockchainInfo = jest.fn().mockResolvedValue({ blocks: 110 });
      mockProto.getWalletInfo = jest.fn().mockResolvedValue({ balance: 0 });
      const txid = await bitcoindService.sendFunds(node, 'destaddr', 10);
      expect(getInst().getWalletInfo).toBeCalledTimes(1);
      expect(getInst().sendToAddress).toBeCalledWith('destaddr', 10);
      expect(txid).toEqual('txid');
    });
  });

  describe('waitUntilOnline', () => {
    it('should return true when successful', async () => {
      const result = await bitcoindService.waitUntilOnline();
      expect(result).toBe(true);
      expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    });

    it('should return false on failure', async () => {
      mockProto.getBlockchainInfo = jest.fn().mockRejectedValue(new Error());
      const result = await bitcoindService.waitUntilOnline(18443, 0.5, 1);
      expect(result).toBe(false);
      expect(getInst().getBlockchainInfo).toBeCalledTimes(1);
    });
  });
});
