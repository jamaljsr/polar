import { waitFor } from '@testing-library/react';
import { createStore } from 'easy-peasy';
import { LndNode, Status } from 'shared/types';
import {
  LightningNodeBalances,
  LightningNodeChannel,
  LightningNodeInfo,
} from 'lib/lightning/types';
import * as asyncUtil from 'utils/async';
import { initChartFromNetwork } from 'utils/chart';
import {
  bitcoinServiceMock,
  defaultStateInfo,
  getNetwork,
  injections,
  lightningServiceMock,
  mockProperty,
} from 'utils/tests';
import appModel from './app';
import bitcoinModel from './bitcoin';
import designerModel from './designer';
import lightningModel from './lightning';
import modalsModel from './modals';
import networkModel from './network';

jest.mock('utils/async');
const asyncUtilMock = asyncUtil as jest.Mocked<typeof asyncUtil>;

describe('Lightning Model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    lightning: lightningModel,
    bitcoin: bitcoinModel,
    designer: designerModel,
    modals: modalsModel,
  };
  const network = getNetwork();
  const initialState = {
    network: {
      networks: [network],
    },
    designer: {
      activeId: 1,
      allCharts: {
        1: initChartFromNetwork(network),
      },
    },
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections, initialState });
  const node = initialState.network.networks[0].nodes.lightning[0] as LndNode;
  const mockChannelInfo = {
    uniqueId: 'channel1',
    id: 'channel1',
    to: 'node2',
    from: 'node1',
    localBalance: '1000',
    remoteBalance: '2000',
    nextLocalBalance: 1000,
    pending: false,
    channelPoint: '',
    pubkey: '',
    capacity: '',
    status: 'Open' as const,
    isPrivate: false,
  };

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections, initialState });

    asyncUtilMock.delay.mockResolvedValue(Promise.resolve());
    bitcoinServiceMock.sendFunds.mockResolvedValue('txid');
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
    lightningServiceMock.getChannels.mockResolvedValue([]);
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
    const modifiedNode = { ...node, backendName: 'not-valid' };
    await depositFunds({ node: modifiedNode, sats: '50000' });
    const nodeState = store.getState().lightning.nodes[node.name];
    expect(nodeState.walletBalance).toBeDefined();
    const balances = nodeState.walletBalance as LightningNodeBalances;
    expect(balances.confirmed).toEqual('100');
    expect(balances.unconfirmed).toEqual('200');
    expect(balances.total).toEqual('300');
  });

  it('should not throw an error when connecting peers', async () => {
    const { connectAllPeers } = store.getActions().lightning;
    lightningServiceMock.getInfo.mockResolvedValue(
      defaultStateInfo({ alias: 'alice', pubkey: 'xyz', rpcUrl: 'asdf' }),
    );
    lightningServiceMock.getInfo.mockRejectedValueOnce(new Error('getInfo-error'));
    await expect(connectAllPeers(network)).resolves.not.toThrow();
  });

  it('should open a channel successfully', async () => {
    lightningServiceMock.getInfo.mockResolvedValueOnce(
      defaultStateInfo({
        pubkey: 'abcdef',
        syncedToChain: true,
        rpcUrl: 'abcdef@1.1.1.1:9735',
      }),
    );

    const [from, to] = store.getState().network.networks[0].nodes.lightning;
    const sats = '1000';
    const { openChannel, getInfo } = store.getActions().lightning;
    await getInfo(to);
    await openChannel({ from, to, sats, autoFund: false, isPrivate: false });
    expect(lightningServiceMock.getInfo).toHaveBeenCalledTimes(1);
    expect(lightningServiceMock.openChannel).toHaveBeenCalledTimes(1);
    expect(bitcoinServiceMock.mine).toHaveBeenCalledTimes(1);
  });

  it('should open a channel and mine on the first bitcoin node', async () => {
    lightningServiceMock.getInfo.mockResolvedValueOnce(
      defaultStateInfo({
        pubkey: 'abcdef',
        syncedToChain: true,
        rpcUrl: 'abcdef@1.1.1.1:9735',
      }),
    );

    const [from, to] = store.getState().network.networks[0].nodes.lightning;
    from.backendName = 'invalid';
    const sats = '1000';
    const { openChannel, getInfo } = store.getActions().lightning;
    await getInfo(to);
    await openChannel({ from, to, sats, autoFund: false, isPrivate: false });
    const btcNode = store.getState().network.networks[0].nodes.bitcoin[0];
    expect(bitcoinServiceMock.mine).toHaveBeenCalledWith(6, btcNode);
  });

  it('should cause some delay waiting for nodes', async () => {
    mockProperty(process, 'env', { NODE_ENV: 'production' } as any);

    const { waitForNodes } = store.getActions().lightning;
    await waitForNodes(network.nodes.lightning);
    expect(asyncUtilMock.delay).toHaveBeenCalledWith(2000);

    mockProperty(process, 'env', { NODE_ENV: 'test' } as any);
  });

  it('should add listeners to the lightning nodes in the network', async () => {
    const { addListeners } = store.getActions().lightning;
    await addListeners(network);
    expect(lightningServiceMock.addListenerToNode).toHaveBeenCalledTimes(
      network.nodes.lightning.length,
    );
    network.nodes.lightning.forEach(node =>
      expect(lightningServiceMock.addListenerToNode).toHaveBeenCalledWith(node),
    );
  });

  it('should remove listeners from the lightning nodes in the network', async () => {
    const { removeListeners } = store.getActions().lightning;
    await removeListeners(network);
    expect(lightningServiceMock.removeListener).toHaveBeenCalledTimes(
      network.nodes.lightning.length,
    );
    network.nodes.lightning.forEach(node =>
      expect(lightningServiceMock.removeListener).toHaveBeenCalledWith(node),
    );
  });

  it('should add Channel Listeners to each lightning node in the network', async () => {
    lightningServiceMock.subscribeChannelEvents.mockImplementation(async (_node, cb) => {
      cb({ type: 'Pending' });
      cb({ type: 'Open' });
      cb({ type: 'Closed' });
      cb({ type: 'Unknown' });
    });

    const { addChannelListeners } = store.getActions().lightning;
    await addChannelListeners(network);

    expect(lightningServiceMock.subscribeChannelEvents).toHaveBeenCalledTimes(
      network.nodes.lightning.length,
    );
    network.nodes.lightning.forEach(node =>
      expect(lightningServiceMock.subscribeChannelEvents).toHaveBeenCalledWith(
        node,
        expect.any(Function),
      ),
    );
  });

  it('should sync the chart when a channel event occurs', async () => {
    const callbacks: Record<string, any> = {};
    lightningServiceMock.subscribeChannelEvents.mockImplementation(async (_node, cb) => {
      callbacks[_node.name] = cb;
    });

    const { addChannelListeners } = store.getActions().lightning;
    await addChannelListeners(network);
    expect(Object.keys(callbacks)).toHaveLength(4);

    // spy on the syncChart action and prevent it from running because it requires
    // mocking a bunch and API calls
    const spy = jest
      .spyOn(store.getActions().designer, 'syncChart')
      .mockResolvedValue(false);
    store.getActions().network.setStatus({ id: network.id, status: Status.Started });

    // simulate a channel event
    const callback = callbacks[network.nodes.lightning[0].name];
    callback({ type: 'Pending' });
    waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
  });

  it('should reset channels info', async () => {
    lightningServiceMock.getChannels.mockResolvedValue([mockChannelInfo]);

    const linksMock = {
      channel1: {
        id: 'channel1',
        from: { nodeId: 'node1', portId: 'port1' },
        to: { nodeId: 'node2', portId: 'port2' },
      },
    };
    store.getState().designer.activeChart.links = linksMock;

    const { resetChannelsInfo } = store.getActions().lightning;
    await resetChannelsInfo(network);
    const { channelsInfo } = store.getState().lightning;

    expect(channelsInfo).toHaveLength(4);
    expect([channelsInfo[0]]).toEqual([
      {
        id: 'channel1',
        to: 'node2',
        from: 'node1',
        localBalance: '1000',
        remoteBalance: '2000',
        nextLocalBalance: 1000,
      },
    ]);
  });

  it('should manually balance channel', () => {
    store.getActions().lightning.setChannelsInfo([mockChannelInfo]);
    const { manualBalanceChannelsInfo } = store.getActions().lightning;
    manualBalanceChannelsInfo({ value: 500000, index: 0 });
    const { channelsInfo } = store.getState().lightning;
    expect(channelsInfo[0].nextLocalBalance).toBe(500000);
  });

  it('should auto balance channels', () => {
    let { channelsInfo } = store.getState().lightning;

    store.getActions().lightning.setChannelsInfo([mockChannelInfo]);
    const { autoBalanceChannelsInfo } = store.getActions().lightning;
    autoBalanceChannelsInfo();
    channelsInfo = store.getState().lightning.channelsInfo;
    expect(channelsInfo[0].nextLocalBalance).toBe(1500);
  });

  describe('updateBalanceOfChannels', () => {
    const mockChannelInfo = {
      id: 'channel1',
      to: 'node2',
      from: 'node1',
      localBalance: '40000',
      remoteBalance: '60000',
      nextLocalBalance: 50000,
    };
    beforeEach(() => {
      const { setChannelsInfo } = store.getActions().lightning;
      setChannelsInfo([mockChannelInfo]);
      console.log('channelsInfo in state:', store.getState().lightning.channelsInfo);
    });

    // it('should balance channels and show notification', async () => {
    //   const { updateBalanceOfChannels } = store.getActions().lightning;
    //   await updateBalanceOfChannels(network);
    //   expect(lightningServiceMock.createInvoice).toHaveBeenCalled();
    //   expect(lightningServiceMock.payInvoice).toHaveBeenCalled();
    //   expect(store.getActions().lightning.balanceChannels).toBe(false);
    // });

    // it('should skip balancing if difference is too small', async () => {
    //   store.getActions().lightning.setChannelsInfo([
    //     {
    //       ...mockChannelInfo,
    //       nextLocalBalance: 600020, // Small difference
    //     },
    //   ]);
    //   const { updateBalanceOfChannels } = store.getActions().lightning;
    //   await updateBalanceOfChannels(network);
    //   expect(lightningServiceMock.createInvoice).not.toHaveBeenCalled();
    // });

    it('should throw error for invalid network', async () => {
      const { balanceChannels } = store.getActions().lightning;
      await expect(balanceChannels({ id: 999, toPay: [] })).rejects.toThrow(
        'networkByIdErr',
      );
    });
  });
});
