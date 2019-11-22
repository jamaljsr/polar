import * as LND from '@radar/lnrpc';
import { createStore } from 'easy-peasy';
import { ipcChannels, withDefaults } from 'shared';
import { LndNode } from 'shared/types';
import { LightningNodeInfo } from 'lib/lightning/types';
import { BitcoindLibrary, LndLibrary } from 'types';
import * as asyncUtil from 'utils/async';
import { getNetwork, injections } from 'utils/tests';
import { defaultInfo } from 'utils/tests/nodeStateDefaults';
import lndModel from './lnd';
import networkModel from './network';

jest.mock('utils/async');
const asyncUtilMock = asyncUtil as jest.Mocked<typeof asyncUtil>;
const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('LND Model', () => {
  const rootModel = {
    network: networkModel,
    lnd: lndModel,
  };
  const initialState = {
    network: {
      networks: [getNetwork()],
    },
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections, initialState });
  const node = initialState.network.networks[0].nodes.lightning[0] as LndNode;

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections, initialState });

    asyncUtilMock.delay.mockResolvedValue(true);
    bitcoindServiceMock.sendFunds.mockResolvedValue('txid');
    lndServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
    lndServiceMock.getInfo.mockResolvedValue(
      defaultInfo({
        alias: 'my-node',
        pubkey: 'abcdef',
        syncedToChain: true,
      }),
    );
    lndServiceMock.getWalletBalance.mockResolvedValue({
      confirmedBalance: '100',
      unconfirmedBalance: '200',
      totalBalance: '300',
    });
    lndServiceMock.listChannels.mockResolvedValue(
      withDefaults({}, ipcChannels.listChannels),
    );
    lndServiceMock.pendingChannels.mockResolvedValue(
      withDefaults({}, ipcChannels.pendingChannels),
    );
  });

  it('should have a valid initial state', () => {
    expect(store.getState().lnd.nodes).toEqual({});
  });

  it('should update state with getInfo response', async () => {
    const { getInfo } = store.getActions().lnd;
    await getInfo(node);
    const nodeState = store.getState().lnd.nodes[node.name];
    expect(nodeState.info).toBeDefined();
    const info = nodeState.info as LightningNodeInfo;
    expect(info.alias).toEqual('my-node');
    expect(info.pubkey).toEqual('abcdef');
    expect(info.syncedToChain).toEqual(true);
  });

  it('should update state with getBalance response', async () => {
    const { getWalletBalance } = store.getActions().lnd;
    await getWalletBalance(node);
    const nodeState = store.getState().lnd.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LND.WalletBalanceResponse;
    expect(balances.confirmedBalance).toEqual('100');
    expect(balances.unconfirmedBalance).toEqual('200');
    expect(balances.totalBalance).toEqual('300');
  });

  it('should update state with getChannels response', async () => {
    const { getChannels } = store.getActions().lnd;
    await getChannels(node);
    const nodeState = store.getState().lnd.nodes[node.name];
    expect(nodeState.channels).toBeDefined();
    const channels = nodeState.channels;
    if (channels) {
      expect(channels.open).toEqual([]);
      expect(channels.opening).toEqual([]);
      expect(channels.closing).toEqual([]);
      expect(channels.forceClosing).toEqual([]);
      expect(channels.waitingClose).toEqual([]);
    }
  });

  it('should be able to deposit funds using the backend bitcoin node', async () => {
    const { depositFunds } = store.getActions().lnd;
    await depositFunds({ node, sats: '50000' });
    const nodeState = store.getState().lnd.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LND.WalletBalanceResponse;
    expect(balances.confirmedBalance).toEqual('100');
    expect(balances.unconfirmedBalance).toEqual('200');
    expect(balances.totalBalance).toEqual('300');
  });

  it('should be able to deposit funds using the first bitcoin node', async () => {
    const { depositFunds } = store.getActions().lnd;
    const modifiednode = { ...node, backendName: 'not-valid' };
    await depositFunds({ node: modifiednode, sats: '50000' });
    const nodeState = store.getState().lnd.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LND.WalletBalanceResponse;
    expect(balances.confirmedBalance).toEqual('100');
    expect(balances.unconfirmedBalance).toEqual('200');
    expect(balances.totalBalance).toEqual('300');
  });
});
