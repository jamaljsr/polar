import * as LND from '@radar/lnrpc';
import { LndLibrary, LndNode } from 'types';
import { waitFor } from 'utils/async';
import { lndProxyClient as proxy } from './';

class LndService implements LndLibrary {
  async getInfo(node: LndNode): Promise<LND.GetInfoResponse> {
    return await proxy.getInfo(node);
  }

  async getWalletBalance(node: LndNode): Promise<LND.WalletBalanceResponse> {
    return await proxy.getWalletBalance(node);
  }

  async getNewAddress(node: LndNode): Promise<LND.NewAddressResponse> {
    return await proxy.getNewAddress(node);
  }

  async openChannel(
    from: LndNode,
    to: LndNode,
    amount: string,
  ): Promise<LND.ChannelPoint> {
    // get pubkey of dest node
    const { identityPubkey: toPubKey } = await proxy.getInfo(to);

    // get peers of source node
    const { peers } = await proxy.listPeers(from);
    // check if already connected
    const peer = peers.find(p => p.pubKey === toPubKey);

    // add peer if not connected
    if (!peer) {
      const addr: LND.LightningAddress = {
        pubkey: toPubKey,
        // TODO: move this into a util file
        host: `polar-n${to.networkId}-${to.name}`,
      };
      await proxy.connectPeer(from, { addr });
    }

    // open channel
    const req: LND.OpenChannelRequest = {
      nodePubkeyString: toPubKey,
      localFundingAmount: amount,
    };
    return await proxy.openChannel(from, req);
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LndNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 30 * 1000, // timeout after 30 seconds
  ): Promise<boolean> {
    return waitFor(
      async () => {
        try {
          await this.getInfo(node);
          return true;
        } catch {
          return false;
        }
      },
      interval,
      timeout,
    );
  }
}

export default new LndService();
