import { debug } from 'electron-log';
import { CLightningNode, LightningNode, OpenChannelOptions } from 'shared/types';
import { getDocker } from 'lib/docker/dockerService';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { exists, write } from 'utils/files';
import { getContainerName } from 'utils/network';
import { httpPost } from './clightningApi';
import * as CLN from './types';

// exec command and options configuration
const execCommand = {
  AttachStdout: true,
  AttachStderr: true,
  AttachStdin: true,
  Tty: true,
  Cmd: ['/bin/bash'],
};

const execOptions = {
  Tty: true,
  stream: true,
  stdin: true,
  stdout: true,
  stderr: true,
  // fix vim
  hijack: true,
};

const ChannelStateToStatus: Record<CLN.ChannelState, PLN.LightningNodeChannel['status']> =
  {
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

export interface CachedChannelStatus {
  channelId: string;
  status: PLN.LightningNodeChannel['status'];
}

export class CLightningService implements LightningService {
  // Cache of channel states for each node, in order to simulate channel event streaming
  channelCaches: {
    [nodePort: number]: {
      intervalId: NodeJS.Timeout;
      channels: CachedChannelStatus[];
    };
  } = {};

  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpPost<CLN.GetInfoResponse>(node, 'getinfo');
    return {
      pubkey: info.id,
      alias: info.alias,
      rpcUrl: info.binding
        .filter(b => b.type === 'ipv4')
        .reduce((v, b) => `${info.id}@${node.name}:${b.port}`, ''),
      syncedToChain: !info.warningBitcoindSync && !info.warningLightningdSync,
      blockHeight: info.blockheight,
      numActiveChannels: info.numActiveChannels,
      numPendingChannels: info.numPendingChannels,
      numInactiveChannels: info.numInactiveChannels,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const { outputs } = await httpPost<CLN.ListFundsResponse>(node, 'listfunds');
    let [confirmed, unconfirmed] = [0, 0];
    for (const output of outputs) {
      if (output.status === 'confirmed') {
        confirmed += output.amountMsat / 1000;
      } else {
        unconfirmed += output.amountMsat / 1000;
      }
    }
    const total = confirmed + unconfirmed;

    return {
      total: total.toString(),
      confirmed: confirmed.toString(),
      unconfirmed: unconfirmed.toString(),
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    const { bech32 } = await httpPost<CLN.NewAddrResponse>(node, 'newaddr');
    return { address: bech32 };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const { channels } = await httpPost<CLN.ListPeerChannelsResponse>(
      node,
      'listpeerchannels',
    );
    return channels
      .filter(c => c.opener === 'local')
      .filter(c => ChannelStateToStatus[c.state] !== 'Closed')
      .map(c => {
        const status = ChannelStateToStatus[c.state];
        return {
          pending: status !== 'Open',
          uniqueId: c.shortChannelId,
          channelPoint: c.channelId,
          pubkey: c.peerId,
          capacity: this.toSats(c.totalMsat),
          localBalance: this.toSats(c.toUsMsat),
          remoteBalance: this.toSats(c.totalMsat - c.toUsMsat),
          status,
          isPrivate: c.private,
        };
      });
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const { peers } = await httpPost<CLN.ListPeersResponse>(node, 'listpeers');
    return peers
      .filter(p => p.connected)
      .map(p => ({
        pubkey: p.id,
        address: (p.netaddr && p.netaddr[0]) || '',
      }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const peers = await this.getPeers(node);
    const keys = peers.map(p => p.pubkey);
    const newUrls = rpcUrls.filter(u => !keys.includes(u.split('@')[0]));
    for (const toRpcUrl of newUrls) {
      try {
        const body = { id: toRpcUrl };
        await httpPost<{ id: string }>(node, 'connect', body);
      } catch (error: any) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to c-lightning node ${node.name}:`,
          error.message,
        );
      }
    }
  }

  async openChannel({
    from,
    toRpcUrl,
    amount,
    isPrivate,
  }: OpenChannelOptions): Promise<PLN.LightningNodeChannelPoint> {
    // add peer if not connected already
    await this.connectPeers(from, [toRpcUrl]);
    // get pubkey of dest node
    const [toPubKey] = toRpcUrl.split('@');

    // open the channel
    const body: CLN.OpenChannelRequest = {
      id: toPubKey,
      amount: amount,
      feerate: '253perkw', // min relay fee for bitcoind
      announce: isPrivate ? false : true,
    };
    const res = await httpPost<CLN.OpenChannelResponse>(from, 'fundchannel', body);
    return {
      txid: res.txid,
      index: res.outnum,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const body = { id: channelPoint };
    await httpPost<CLN.CloseChannelResponse>(node, `close`, body);
    return true;
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
  ): Promise<string> {
    const body: CLN.InvoiceRequest = {
      amount_msat: amount * 1000,
      label: new Date().getTime().toString(),
      description: memo || `Polar Invoice for ${node.name}`,
    };

    const res = await httpPost<CLN.InvoiceResponse>(node, 'invoice', body);

    return res.bolt11;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
  ): Promise<PLN.LightningNodePayReceipt> {
    const body: CLN.PayRequest = {
      bolt11: invoice,
      amount_msat: amount ? amount * 1000 : undefined,
    };

    const res = await httpPost<CLN.PayResponse>(node, 'pay', body);

    return {
      preimage: res.paymentPreimage,
      amount: res.amountMsat / 1000,
      destination: res.destination,
    };
  }

  /**
   * Helper function to continually query the node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 120 * 1000, // timeout after 120 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.createRune(this.cast(node));
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }
  // this method doesn't have any implementation because Polling is used for CLN nodes
  async addListenerToNode(node: LightningNode): Promise<void> {
    debug('addListenerToNode CLN on port: ', node.ports.rest);
  }

  async removeListener(node: LightningNode): Promise<void> {
    const nodePort = this.getNodePort(node);
    const cache = this.channelCaches[nodePort];
    if (cache) {
      clearInterval(cache.intervalId);
      delete this.channelCaches[nodePort];
    }
  }

  async subscribeChannelEvents(
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ): Promise<void> {
    const nodePort = this.getNodePort(node);
    if (!this.channelCaches[nodePort]) {
      // check c-lightning channels every 30 seconds
      this.channelCaches[nodePort] = {
        intervalId: setInterval(() => {
          this.checkChannels(node, callback);
        }, 30 * 1000),
        channels: [],
      };
    }
  }

  checkChannels = async (
    node: LightningNode,
    callback: (event: PLN.LightningNodeChannelEvent) => void,
  ) => {
    const { channels } = await httpPost<CLN.ListPeerChannelsResponse>(
      node,
      'listpeerchannels',
    );

    const apiChannels = channels
      .filter(c => c.opener === 'local')
      .map(channel => {
        const status = ChannelStateToStatus[channel.state];
        return {
          channelId: channel.channelId,
          status,
        };
      });

    const cache = this.channelCaches[this.getNodePort(node)] || { channels: [] };
    const uniqueChannels = this.getUniqueChannels(cache.channels, apiChannels);
    uniqueChannels.forEach(channel => {
      if (channel.status === 'Open') {
        callback({ type: 'Open' });
      } else if (channel.status === 'Closed') {
        callback({ type: 'Closed' });
      } else {
        callback({ type: 'Pending' });
      }
    });
    // edge case for empty apiChannels but cache channels is not empty
    if (cache.channels.length && !apiChannels.length) {
      callback({ type: 'Closed' });
    }

    cache.channels = apiChannels;
  };

  getUniqueChannels = (
    cacheChannels: CachedChannelStatus[],
    apiChannels: CachedChannelStatus[],
  ): CachedChannelStatus[] => {
    const uniqueChannels: CachedChannelStatus[] = [];
    // Check channels in apiChannels that are not in cacheChannels
    for (const channel of apiChannels) {
      if (
        !cacheChannels.some(
          cacheCh =>
            cacheCh.channelId === channel.channelId && cacheCh.status === channel.status,
        )
      ) {
        uniqueChannels.push(channel);
      }
    }

    return uniqueChannels;
  };

  private toSats(msats: number): string {
    return (msats / 1000).toFixed(0).toString();
  }

  private getNodePort(node: LightningNode): number {
    if (node.implementation !== 'c-lightning')
      throw new Error(
        `ClightningService cannot be used for '${node.implementation}' nodes`,
      );
    return (node as CLightningNode).ports.rest;
  }

  private cast(node: LightningNode): CLightningNode {
    if (node.implementation !== 'c-lightning')
      throw new Error(
        `CLightningService cannot be used for '${node.implementation}' nodes`,
      );

    return node as CLightningNode;
  }

  /**
   * For the CLN REST API we need to provide a rune for authentication. CLN does not
   * create a default rune on startup like LND does with the macaroons. This function
   * will create a rune and save it to the node's data directory as admin.rune.
   */
  private async createRune(node: CLightningNode) {
    if (await exists(node.paths.rune)) return;

    // lookup the docker container by name
    const name = getContainerName(node);
    debug(`creating rune for CLN node ${name}`);
    const docker = await getDocker();
    debug(`getting docker container with name '${name}'`);
    const containers = await docker.listContainers();
    const info = containers.find(c => c.Names.includes(`/${name}`));
    debug(`found container: ${info?.Id}`);
    const container = info && docker.getContainer(info.Id);
    if (!container) throw new Error(`Docker container not found: ${name}`);
    // create an exec instance
    const exec = await container.exec({ ...execCommand, User: 'clightning' });
    // run exec to connect to the container
    const stream = await exec.start(execOptions);

    let result = '';
    // capture the data from docker
    stream.on('data', (data: Buffer) => {
      result += data.toString();
    });

    // send the createrune command and exit immediately to end the stream
    debug(`sending createrune command`);
    stream.write('lightning-cli --network regtest createrune\n');
    stream.write('exit\n');

    // wait for the command to finish
    await new Promise(resolve => stream.on('close', resolve));
    stream.destroy();

    // parse the result for the rune
    debug(`createrune result:\n${result}`);
    const rune = /^\s+"rune": "(?<rune>.*)",$/gm.exec(result)?.groups?.rune;
    debug(`captured rune: ${rune}`);
    if (!rune) throw new Error('Failed to create CLN rune');

    // save the rune to the node's data directory
    await write(node.paths.rune, rune);
    debug(`saved rune to ${node.paths.rune}`);
  }
}

export default new CLightningService();
