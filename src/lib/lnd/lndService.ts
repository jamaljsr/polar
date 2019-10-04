import * as LND from '@radar/lnrpc';
import { LndLibrary, LndNode } from 'types';
import { waitFor } from 'utils/async';
import { lndProxyClient } from './';

class LndService implements LndLibrary {
  async getInfo(node: LndNode): Promise<LND.GetInfoResponse> {
    return await lndProxyClient.getInfo(node);
  }

  async getWalletBalance(node: LndNode): Promise<LND.WalletBalanceResponse> {
    return await lndProxyClient.getWalletBalance(node);
  }

  async getNewAddress(node: LndNode): Promise<LND.NewAddressResponse> {
    return await lndProxyClient.getNewAddress(node);
  }

  async openChannel(
    from: LndNode,
    to: LndNode,
    amount: string,
  ): Promise<LND.ChannelPoint> {
    // get peers

    // add peer if not already

    // get pubkey of dest node

    // open channel
    const req: LND.OpenChannelRequest = {
      nodePubkeyString: '',
      localFundingAmount: amount,
    };
    return await lndProxyClient.openChannel(from, req);
  }

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
