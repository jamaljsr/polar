import BitcoinCore from 'bitcoin-core';
import { BitcoinNode } from 'shared/types';
import { BitcoindLibrary } from 'types';
import { waitFor } from 'utils/async';
import { BLOCKS_TIL_COMFIRMED, COINBASE_MATURITY_HEIGHT } from 'utils/constants';

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

  /**
   * Send an amount of bitcoin to an address
   * @param node the bitcoin node to communicate with
   * @param toAddress the destination wallet address to send funds to
   * @param amount the amount denominated in bitcoin
   */
  async sendFunds(node: BitcoinNode, toAddress: string, amount: number) {
    const port = node.ports.rpc;
    const client = this.creatClient(port);
    const { balance } = await client.getWalletInfo();
    if (balance <= amount) {
      // if the bitcoin node doesn't have enough coins them mine more
      await this.mineUntilMaturity(port);
      await this.mine(this.getBlocksToMine(amount - balance), port);
    }
    const txid = await client.sendToAddress(toAddress, amount);
    // mine more blocks to confirm the txn
    await this.mine(BLOCKS_TIL_COMFIRMED, port);
    return txid;
  }

  async mine(numBlocks: number, port?: number) {
    const client = this.creatClient(port);
    const addr = await client.getNewAddress();
    return await client.generateToAddress(numBlocks, addr);
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

  /**
   * will mine up to block #100 if necessary in order for
   * fresh coins to be spendable
   */
  private async mineUntilMaturity(port?: number) {
    const { blocks } = await this.getBlockchainInfo(port);
    if (blocks < COINBASE_MATURITY_HEIGHT) {
      const blocksLeft = COINBASE_MATURITY_HEIGHT - blocks;
      await this.mine(blocksLeft, port);
    }
  }

  /**
   * Returns the number of blocks to mine in order to generate the desired
   * number of coins
   * @param desiredCoins the amount of coins to increase the balance by
   */
  private getBlocksToMine(desiredCoins: number): number {
    // TODO: factor in the halvings
    const COINS_PER_BLOCK = 50;
    const numBlocks = desiredCoins / COINS_PER_BLOCK;
    // round the number up 1
    return Math.round(numBlocks) + 1;
  }
}

export default new BitcoindService();
