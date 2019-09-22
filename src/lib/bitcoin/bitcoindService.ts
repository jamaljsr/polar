import BitcoinCore from 'bitcoin-core';
import { BitcoindLibrary } from 'types';

class BitcoindService implements BitcoindLibrary {
  creatClient() {
    return new BitcoinCore({
      port: '18443',
      username: 'polaruser',
      password: 'polarpass',
    });
  }

  async getBlockchainInfo() {
    return await this.creatClient().getBlockchainInfo();
  }

  async getWalletInfo() {
    return await this.creatClient().getWalletInfo();
  }

  async mine(numBlocks: number) {
    const client = this.creatClient();
    const addr = await client.getNewAddress();
    return await client.generateToAddress(numBlocks, addr);
  }
}

export default new BitcoindService();
