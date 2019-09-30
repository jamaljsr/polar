import BitcoinCore from 'bitcoin-core';
import { warn } from 'console';
import { BitcoindLibrary } from 'types';
import { waitFor } from 'utils/async';

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

  async waitUntilOnline(port?: number) {
    return waitFor(
      async () => {
        try {
          warn('waitUntilOnline start', port);
          await this.getBlockchainInfo(port);
          warn('waitUntilOnline success', port);
          return Promise.resolve(true);
        } catch {
          warn('waitUntilOnline failed', port);
          return Promise.resolve(false);
        }
      },
      3 * 1000, // check every 3 seconds
      30 * 1000, // timeout after 30 seconds
    );
  }

  async mine(numBlocks: number, port?: number) {
    const client = this.creatClient(port);
    const addr = await client.getNewAddress();
    return await client.generateToAddress(numBlocks, addr);
  }
}

export default new BitcoindService();
