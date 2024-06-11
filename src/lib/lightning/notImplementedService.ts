/* eslint-disable @typescript-eslint/no-unused-vars */
import { LightningNode, OpenChannelOptions } from 'shared/types';
import { LightningService } from 'types';
import * as PLN from './types';

/**
 * A Lightning Service class whose functions are not yet implemented
 */
class NotImplementedService implements LightningService {
  getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    throw new Error(`getInfo is not implemented for ${node.implementation} nodes`);
  }
  getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    throw new Error(`getBalances is not implemented for ${node.implementation} nodes`);
  }
  waitUntilOnline(node: LightningNode): Promise<void> {
    throw new Error(
      `waitUntilOnline is not implemented for ${node.implementation} nodes`,
    );
  }
  getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    throw new Error(`getNewAddress is not implemented for ${node.implementation} nodes`);
  }
  getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    throw new Error(`getChannels is not implemented for ${node.implementation} nodes`);
  }
  getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    throw new Error(`getPeers is not implemented for ${node.implementation} nodes`);
  }
  connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    throw new Error(`connectPeers is not implemented for ${node.implementation} nodes`);
  }
  openChannel({
    from,
    toRpcUrl,
    amount,
  }: OpenChannelOptions): Promise<PLN.LightningNodeChannelPoint> {
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
  decodeInvoice(
    node: LightningNode,
    invoice: string,
  ): Promise<PLN.LightningNodePaymentRequest> {
    throw new Error(`decodeInvoice is not implemented for ${node.implementation} nodes`);
  }

  addListenerToNode(node: LightningNode): Promise<void> {
    throw new Error(
      `addListenerToNode is not implemented for ${node.implementation} nodes`,
    );
  }

  removeListener(node: LightningNode): Promise<void> {
    throw new Error(`removeListener is not implemented for ${node.implementation} nodes`);
  }

  subscribeChannelEvents(
    node: LightningNode,
    callback: (data: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    throw new Error(
      `subscribeChannelEvents is not implemented for ${node.implementation} nodes`,
    );
  }
}

export default new NotImplementedService();
