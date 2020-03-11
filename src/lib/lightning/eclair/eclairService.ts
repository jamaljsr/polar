/* eslint-disable @typescript-eslint/no-unused-vars */
import { BitcoinNode, EclairNode, LightningNode } from 'shared/types';
import { bitcoindService } from 'lib/bitcoin';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { toSats } from 'utils/units';
import * as PLN from '../types';
import { httpPost } from './eclairApi';
import * as ELN from './types';

class EclairService implements LightningService {
  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpPost<ELN.GetInfoResponse>(this.cast(node), 'getinfo');
    return {
      pubkey: info.nodeId,
      alias: info.alias,
      rpcUrl: (info.publicAddresses && info.publicAddresses[0]) || '',
      syncedToChain: true,
      blockHeight: info.blockHeight,
      numActiveChannels: 0,
      numPendingChannels: 0,
      numInactiveChannels: 0,
    };
  }

  async getBalances(
    node: LightningNode,
    backend?: BitcoinNode,
  ): Promise<PLN.LightningNodeBalances> {
    const btcNode = this.validateBackend('getNewAddress', backend);
    const balances = await bitcoindService.getWalletInfo(btcNode);
    const unconfirmed = balances.unconfirmed_balance + balances.immature_balance;
    return {
      total: toSats(balances.balance + unconfirmed),
      confirmed: toSats(balances.balance),
      unconfirmed: toSats(unconfirmed),
    };
  }
  async getNewAddress(
    node: LightningNode,
    backend?: BitcoinNode,
  ): Promise<PLN.LightningNodeAddress> {
    const btcNode = this.validateBackend('getNewAddress', backend);
    const address = await bitcoindService.getNewAddress(btcNode);
    return { address };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    return [] as any;
  }

  getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    throw new Error(`getPeers is not implemented for ${node.implementation} nodes`);
  }

  connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    throw new Error(`connectPeers is not implemented for ${node.implementation} nodes`);
  }

  openChannel(
    from: LightningNode,
    toRpcUrl: string,
    amount: string,
  ): Promise<PLN.LightningNodeChannelPoint> {
    throw new Error(`openChannel is not implemented for ${from.implementation} nodes`);
  }

  closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    throw new Error(`closeChannel is not implemented for ${node.implementation} nodes`);
  }

  createInvoice(node: LightningNode, amount: number, memo?: string): Promise<string> {
    throw new Error(`createInvoice is not implemented for ${node.implementation} nodes`);
  }

  payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    throw new Error(`payInvoice is not implemented for ${node.implementation} nodes`);
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 60 * 1000, // timeout after 60 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  private cast(node: LightningNode): EclairNode {
    if (node.implementation !== 'eclair')
      throw new Error(`EclairService cannot be used for '${node.implementation}' nodes`);

    return node as EclairNode;
  }

  private validateBackend(action: string, backend?: BitcoinNode) {
    if (!backend) throw new Error(`EclairService ${action}: backend was not specified`);

    return backend as BitcoinNode;
  }
}

export default new EclairService();
