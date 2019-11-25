import { debug } from 'electron-log';
import { CLightningNode, LightningNode } from 'shared/types';
import {
  LightningNodeAddress,
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeChannelPoint,
  LightningNodeInfo,
} from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { read } from 'utils/files';
import { snakeKeysToCamel } from 'utils/objects';
import * as CLN from './types';

const ChannelStateToStatus: Record<CLN.ChannelState, LightningNodeChannel['status']> = {
  CHANNELD_AWAITING_LOCKIN: 'Opening',
  CHANNELD_NORMAL: 'Open',
  CHANNELD_SHUTTING_DOWN: 'Closing',
  CLOSINGD_SIGEXCHANGE: 'Closing',
  CLOSINGD_COMPLETE: 'Waiting to Close',
  AWAITING_UNILATERAL: 'Force Closing',
  FUNDING_SPEND_SEEN: 'Waiting to Close',
  ONCHAIN: 'Closed',
  CLOSED: 'Closed',
};

class CLightningService implements LightningService {
  async getInfo(node: LightningNode): Promise<LightningNodeInfo> {
    const info = await this.request<CLN.GetInfoResponse>(node, 'getinfo');
    return {
      pubkey: info.id,
      alias: info.alias,
      rpcUrl: '',
      syncedToChain: !info.warningBitcoindSync && !info.warningLightningdSync,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<LightningNodeBalances> {
    const balances = await this.request<CLN.GetBalanceResponse>(node, 'getBalance');
    return {
      total: balances.totalBalance.toString(),
      confirmed: balances.confBalance.toString(),
      unconfirmed: balances.unconfBalance.toString(),
    };
  }

  async getNewAddress(node: LightningNode): Promise<LightningNodeAddress> {
    const address = await this.request<LightningNodeAddress>(node, 'newaddr');
    return address;
  }

  async getChannels(node: LightningNode): Promise<LightningNodeChannel[]> {
    const channels = await this.request<CLN.GetChannelsResponse[]>(
      node,
      'channel/listChannels',
    );
    return channels
      .filter(c => ChannelStateToStatus[c.state] !== 'Closed')
      .map(c => {
        const status = ChannelStateToStatus[c.state];
        return {
          pending: status !== 'Open',
          uniqueId: c.fundingTxid.slice(-12),
          channelPoint: c.fundingTxid,
          pubkey: c.id,
          capacity: this.toSats(c.msatoshiTotal),
          localBalance: this.toSats(c.msatoshiToUs),
          remoteBalance: this.toSats(c.msatoshiTotal - c.msatoshiToUs),
          status,
        };
      });
  }

  async openChannel(
    from: LightningNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    to: LightningNode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    amount: string,
  ): Promise<LightningNodeChannelPoint> {
    /* Sample output
      {
        "tx": "020000000001018375970adb157e76bdf1214d7b874dd7870fc29fc7797be37965ffd2dc534d4f0100000000ffffffff0290d0030000000000220020af14c0deff170638da0652d69766cbe38cfc1e9653f5297723ea717379ed6fc116710b000000000016001406586c3ae5327631466f3db75f949416c2c03e8502483045022100f6066c5a93363b0888aaf6abf02e77ffcb590f2bf2d6a7d9ee6dc6984332a3760220310ef982ccc6f8d04905863dba9e850f5e77af4c935ee624d9bda385da134b83012103016ad498f69789e2fb373fdedaa06c1a3acde26c4e810509357677e91d91aaf100000000",
        "txid": "2b15604898e54dd0157d01a08b8f4cd1862b621506e80eb078b92c7259033bcd",
        "channel_id": "cd3b0359722cb978b00ee80615622b86d14c8f8ba0017d15d04de5984860152b"
      }    
    */
    throw new Error(`openChannel is not implemented for ${from.implementation} nodes`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    /* - sample response
      {
        "tx": "0200000001c1c2feecdd65ad005f97879c31a78fa2570ba7c2182358ee1016730e3e38cb920000000000ffffffff013949020000000000160014548e6cc35fa2e56dd33b7c072c88eb9da155a7f600000000",
        "txid": "bdcd0bde6f4bfbb7bd9f69387583c3273cecbe897c237c8a7893e67c215be671",
        "type": "mutual"
      }
    */
    throw new Error(`closeChannel is not implemented for ${node.implementation} nodes`);
  }

  /**
   * Helper function to continually query the node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  private async request<T>(node: LightningNode, path: string) {
    debug(`c-lightning API Request`);
    const { paths, ports } = this.cast(node);
    const url = `http://127.0.0.1:${ports.rest}/v1/${path}`;
    debug(` - url: ${url}`);
    const macaroon = await read(paths.macaroon, 'base64');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        macaroon,
      },
    });
    const json = await response.json();
    debug(` - resp: ${JSON.stringify(json, null, 2)}`);
    return snakeKeysToCamel(json) as T;
  }

  private toSats(msats: number): string {
    return (msats / 1000).toString();
  }

  private cast(node: LightningNode): CLightningNode {
    if (node.implementation !== 'c-lightning')
      throw new Error(
        `ClightningService cannot be used for '${node.implementation}' nodes`,
      );

    return node as CLightningNode;
  }
}

export default new CLightningService();
