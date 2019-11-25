import { createStore } from 'easy-peasy';
import { LndNode } from 'shared/types';
import {
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeInfo,
} from 'lib/lightning/types';
import { BitcoindLibrary } from 'types';
import * as asyncUtil from 'utils/async';
import {
  defaultStateInfo,
  getNetwork,
  injections,
  lightningServiceMock,
} from 'utils/tests';
import lightningModel from './lightning';
import networkModel from './network';

jest.mock('utils/async');
const asyncUtilMock = asyncUtil as jest.Mocked<typeof asyncUtil>;
const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('LND Model', () => {
  const rootModel = {
    network: networkModel,
    lightning: lightningModel,
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
    lightningServiceMock.getNewAddress.mockResolvedValue({ address: 'bc1aaaa' });
    lightningServiceMock.getInfo.mockResolvedValue(
      defaultStateInfo({
        alias: 'my-node',
        pubkey: 'abcdef',
        syncedToChain: true,
      }),
    );
    lightningServiceMock.getBalances.mockResolvedValue({
      confirmed: '100',
      unconfirmed: '200',
      total: '300',
    });
    lightningServiceMock.getChannels.mockResolvedValueOnce([]);
  });

  it('should have a valid initial state', () => {
    expect(store.getState().lightning.nodes).toEqual({});
  });

  it('should update state with getInfo response', async () => {
    const { getInfo } = store.getActions().lightning;
    await getInfo(node);
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.info).toBeDefined();
    const info = nodeState.info as LightningNodeInfo;
    expect(info.alias).toEqual('my-node');
    expect(info.pubkey).toEqual('abcdef');
    expect(info.syncedToChain).toEqual(true);
  });

  it('should update state with getBalance response', async () => {
    const { getWalletBalance } = store.getActions().lightning;
    await getWalletBalance(node);
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LightningNodeBalances;
    expect(balances.confirmed).toEqual('100');
    expect(balances.unconfirmed).toEqual('200');
    expect(balances.total).toEqual('300');
  });

  it('should update state with getChannels response', async () => {
    const { getChannels } = store.getActions().lightning;
    await getChannels(node);
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.channels).toBeDefined();
    const channels = nodeState.channels as LightningNodeChannel[];
    expect(channels).toEqual([]);
  });

  it('should be able to deposit funds using the backend bitcoin node', async () => {
    const { depositFunds } = store.getActions().lightning;
    await depositFunds({ node, sats: '50000' });
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LightningNodeBalances;
    expect(balances.confirmed).toEqual('100');
    expect(balances.unconfirmed).toEqual('200');
    expect(balances.total).toEqual('300');
  });

  it('should be able to deposit funds using the first bitcoin node', async () => {
    const { depositFunds } = store.getActions().lightning;
    const modifiednode = { ...node, backendName: 'not-valid' };
    await depositFunds({ node: modifiednode, sats: '50000' });
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LightningNodeBalances;
    expect(balances.confirmed).toEqual('100');
    expect(balances.unconfirmed).toEqual('200');
    expect(balances.total).toEqual('300');
  });
});
