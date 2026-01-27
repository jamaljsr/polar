import { BitcoinService } from 'types';
import { httpPost } from './btcdApi';
import { BitcoinNode } from 'shared/types';
import * as BTCD from './types';
import logger from 'electron-log';
import {
  btcdCredentials,
  COINBASE_MATURITY_DELAY,
  INITIAL_BLOCK_REWARD,
} from 'utils/constants';
import { HALVING_INTERVAL } from 'utils/constants';
import { delay, waitFor } from 'utils/async';

// ts-ignore
class BtcdService implements BitcoinService {
  async createDefaultWallet(node: BitcoinNode) {
    // We will instead unlock the default wallet since it is created by default.
    const body = {
      jsonrpc: '1.0',
      method: 'walletpassphrase',
      params: [btcdCredentials.pass, 0], // 0 = unlock indefinitely.
    };
    logger.debug('Unlocking default wallet for btcd node');
    return await httpPost<any>(node, body);
  }

  async getBlockchainInfo(node: BitcoinNode) {
    const body = {
      jsonrpc: '1.0',
      method: 'getblockchaininfo',
      params: [],
    };
    logger.debug(`Getting blockchain info for btcd node ${node.name}`);
    const { result } = await httpPost<BTCD.GetBlockchainInfoResponse>(node, body);
    logger.debug(
      `BtcdService.getBlockchainInfo SUCCESS for ${node.name}:`,
      JSON.stringify(result, null, 2),
    );
    return {
      chain: result.chain,
      blocks: result.blocks,
      headers: result.headers,
      bestblockhash: result.bestblockhash,
      difficulty: result.difficulty,
      mediantime: result.mediantime,
      pruned: result.pruned,
      bip9_softforks: [],
      verificationprogress: 0,
      initialblockdownload: false,
      chainwork: '0',
      size_on_disk: 0,
      pruneheight: 0,
      automatic_pruning: false,
      prune_target_size: 0,
      softforks: [],
    };
  }

  async getWalletInfo(node: BitcoinNode) {
    const body = {
      jsonrpc: '1.0',
      method: 'getinfo',
      params: [],
    };
    const { result } = await httpPost<BTCD.GetInfoResponse>(node, body);
    return {
      walletname: 'default',
      walletversion: result.walletversion,
      balance: result.balance,
      unconfirmed_balance: 0,
      immature_balance: 0,
      txcount: 0,
      keypoololdest: result.keypoololdest,
      keypoolsize: result.keypoolsize,
      paytxfee: result.paytxfee,
      hdmasterkeyid: '',
    };
  }

  async getNewAddress(node: BitcoinNode) {
    const body = {
      jsonrpc: '1.0',
      method: 'getnewaddress',
      params: ['default', 'bech32'],
    };
    const { result } = await httpPost<BTCD.GetNewAddressResponse>(node, body);
    return result;
  }

  async connectPeers(node: BitcoinNode) {
    for (const peer of node.peers) {
      try {
        const body = {
          jsonrpc: '1.0',
          method: 'addnode',
          params: [peer, 'add'],
        };
        await httpPost(node, body);
      } catch (error: any) {
        logger.debug(`Failed to add peer '${peer}' to btcd node ${node.name}`, error);
      }
    }
  }

  async sendFunds(node: BitcoinNode, toAddress: string, amount: number) {
    const { blocks } = await this.getBlockchainInfo(node);
    const { balance } = await this.getWalletInfo(node);
    if (balance <= amount) {
      await this.mineUntilMaturity(node);
      await this.mine(this.getBlocksToMine(blocks, amount - balance), node);
    }

    // Send the funds
    const body = {
      jsonrpc: '1.0',
      method: 'sendtoaddress',
      params: [toAddress, amount],
    };
    const { result } = await httpPost<BTCD.SendToAddressResponse>(node, body);
    return result;
  }

  async mine(numBlocks: number, node: BitcoinNode) {
    const body = {
      jsonrpc: '1.0',
      method: 'generate',
      params: [numBlocks],
    };
    return await httpPost<any>(node, body);
  }

  /**
   * Helper function to continually query the btcd node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: BitcoinNode,
    interval = 10 * 1000, // check every 10 seconds
    timeout = 5 * 60 * 1000, // timeout after 5 minutes
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getBlockchainInfo(node);
      },
      interval,
      timeout,
    );
  }

  private async mineUntilMaturity(node: BitcoinNode) {
    // get all of this node's utxos
    const listTrxBody = {
      jsonrpc: '1.0',
      method: 'listtransactions',
      params: [],
    };
    const { result } = await httpPost<BTCD.ListTransactionsResponse>(node, listTrxBody);

    // determine the highest # of confirmations of all utxos. this is
    // the utxo we'd like to spend from
    const confs = Math.max(0, ...result.map((u: BTCD.Transaction) => u.confirmations));
    const neededConfs = Math.max(0, COINBASE_MATURITY_DELAY - confs);
    if (neededConfs > 0) {
      await this.mine(neededConfs, node);
      // this may mine up to 100 blocks at once, so add a couple second
      // delay to allow the other nodes to process all of the new blocks
      await delay(2 * 1000);
    }
  }

  private getBlocksToMine(height: number, desiredCoins: number) {
    // the numeric halving period (1 for the first period with 50 btc reward)
    const halvingPeriod = Math.ceil(height / HALVING_INTERVAL);
    // the current block reward based on the halving period (50 -> 25 -> 12.5 -> etc)
    const currReward = INITIAL_BLOCK_REWARD / halvingPeriod;
    // the number of blocks needed to generate the desired coins, minimum of 1 block
    const numBlocks = desiredCoins < currReward ? 1 : desiredCoins / currReward;
    // round down to the nearest whole number
    return Math.floor(numBlocks);
  }
}

export default new BtcdService();
