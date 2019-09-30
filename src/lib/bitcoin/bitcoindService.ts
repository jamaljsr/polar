import BitcoinCore from 'bitcoin-core';
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

  async waitUntilOnline(
    port?: number,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ) {
    return waitFor(
      async () => {
        try {
          await this.getBlockchainInfo(port);
          return true;
        } catch {
          return false;
        }
      },
      interval,
      timeout,
    );
  }

  async mine(numBlocks: number, port?: number) {
    const client = this.creatClient(port);
    const addr = await client.getNewAddress();
    return await client.generateToAddress(numBlocks, addr);
  }
}

export default new BitcoindService();
