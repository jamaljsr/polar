import BitcoinCore from 'bitcoin-core';
import { BitcoindLibrary } from 'types';

class BitcoindService implements BitcoindLibrary {
  creatClient(port = 18433) {
    return new BitcoinCore({
      port: `${port}`,
      username: 'polaruser',
      password: 'polarpass',
    });
  }

  async getBlockchainInfo(port?: number) {
    return await this.creatClient(port).getBlockchainInfo();
  }

  async getWalletInfo(port?: number) {
    return await this.creatClient(port).getWalletInfo();
  }

  async mine(numBlocks: number, port?: number) {
    const client = this.creatClient(port);
    const addr = await client.getNewAddress();
    return await client.generateToAddress(numBlocks, addr);
  }
}

export default new BitcoindService();
