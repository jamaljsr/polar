import BitcoinCore from 'bitcoin-core';
import { BitcoindLibrary } from 'types';

class BitcoindService implements BitcoindLibrary {
  private client: BitcoinCore;

  constructor() {
    this.client = new BitcoinCore({
      port: '18443',
      username: 'polaruser',
      password: 'polarpass',
    });
  }

  async getBlockchainInfo() {
    return await this.client.getBlockchainInfo();
  }

  async getWalletInfo() {
    return await this.client.getWalletInfo();
  }

  async mine(numBlocks: number) {
    const addr = await this.client.getNewAddress();
    return await this.client.generateToAddress(numBlocks, addr);
  }
}

export default new BitcoindService();
