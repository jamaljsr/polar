import BitcoinCore from 'bitcoin-core';
import bitcoindService from './bitcoindService';

jest.mock('bitcoin-core');

describe('BitcoindService', () => {
  it('should get blockchain info', async () => {
    BitcoinCore.prototype.getBlockchainInfo = jest.fn().mockReturnValue({ blocks: 123 });
    const info = await bitcoindService.getBlockchainInfo();
    expect(BitcoinCore.prototype.getBlockchainInfo).toBeCalledTimes(1);
    expect(info.blocks).toEqual(123);
  });

  it('should get wallet info', async () => {
    BitcoinCore.prototype.getWalletInfo = jest.fn().mockReturnValue({ balance: 123 });
    const info = await bitcoindService.getWalletInfo();
    expect(BitcoinCore.prototype.getWalletInfo).toBeCalledTimes(1);
    expect(info.balance).toEqual(123);
  });

  it('should mine new blocks', async () => {
    BitcoinCore.prototype.getNewAddress = jest.fn().mockReturnValue('abcdef');
    BitcoinCore.prototype.generateToAddress = jest
      .fn()
      .mockReturnValue(['blockhash1', 'blockhash2']);
    const result = await bitcoindService.mine(2);
    expect(BitcoinCore.prototype.getNewAddress).toBeCalledTimes(1);
    expect(BitcoinCore.prototype.generateToAddress).toBeCalledTimes(1);
    expect(BitcoinCore.prototype.generateToAddress).toBeCalledWith(2, 'abcdef');
    expect(result[0]).toEqual('blockhash1');
  });
});
