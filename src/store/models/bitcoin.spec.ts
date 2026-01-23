import { createStore } from 'easy-peasy';
import { createBitcoindNetworkNode } from 'utils/network';
import { bitcoinServiceMock, getNetwork, injections, testNodeDocker } from 'utils/tests';
import appModel from './app';
import bitcoinModel from './bitcoin';
import designerModel from './designer';
import lightningModel from './lightning';
import modalsModel from './modals';
import networkModel from './network';

describe('Bitcoin Model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    bitcoin: bitcoinModel,
    lightning: lightningModel,
    designer: designerModel,
    modals: modalsModel,
  };
  const network = getNetwork();

  let store = createStore(rootModel, { injections });
  const node = network.nodes.bitcoin[0];
  let peerNode: any;

  beforeEach(() => {
    store = createStore(rootModel, {
      injections,
      initialState: {
        network: {
          networks: [network],
        },
      },
    });
    peerNode = createBitcoindNetworkNode(network, '0.18.1', testNodeDocker);
    peerNode.name = 'peer-backend1';
    network.nodes.bitcoin.push(peerNode);

    node.peers = ['peer-backend1'];

    bitcoinServiceMock.getBlockchainInfo.mockResolvedValue({ blocks: 100 } as any);
    bitcoinServiceMock.getWalletInfo.mockResolvedValue({ balance: 5 } as any);
    bitcoinServiceMock.getNetworkInfo.mockResolvedValue({
      p2pHost: 'test123.onion:18444',
    } as any);
    bitcoinServiceMock.connectPeers.mockResolvedValue(undefined);
  });

  it('should connect using onion address when both nodes have Tor enabled', async () => {
    node.enableTor = true;
    peerNode.enableTor = true;
    await store.getActions().bitcoin.connectAllPeers(network);
    expect(bitcoinServiceMock.connectPeers).toHaveBeenCalledWith(node, [
      'test123.onion:18444',
    ]);
  });

  it('should connect using peer name when both nodes have Tor disabled', async () => {
    node.enableTor = false;
    peerNode.enableTor = false;
    await store.getActions().bitcoin.connectAllPeers(network);
    expect(bitcoinServiceMock.connectPeers).toHaveBeenCalledWith(node, ['peer-backend1']);
  });

  it('should connect using peer name when peer node is not found in network', async () => {
    node.enableTor = true;
    node.peers = ['non-existent-peer'];
    await store.getActions().bitcoin.connectAllPeers(network);
    expect(bitcoinServiceMock.connectPeers).toHaveBeenCalledWith(node, [
      'non-existent-peer',
    ]);
  });

  it('should not throw an error when connecting peers', async () => {
    const { connectAllPeers } = store.getActions().bitcoin;
    bitcoinServiceMock.getNetworkInfo.mockRejectedValueOnce(new Error('getInfo-error'));
    await expect(connectAllPeers(network)).resolves.not.toThrow();
  });
});
