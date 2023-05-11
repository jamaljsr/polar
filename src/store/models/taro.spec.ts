import { createStore } from 'easy-peasy';
import { defaultTarodMintAsset } from 'shared';
import { Status, TarodNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { BitcoindLibrary } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import {
  defaultTaroAsset,
  defaultTaroBalance,
  getNetwork,
  injections,
  taroServiceMock,
} from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import lightningModel from './lightning';
import networkModel from './network';
import taroModel, { MintAssetPayload } from './taro';

const bitcoindServiceMock = injections.bitcoindService as jest.Mocked<BitcoindLibrary>;

describe('Taro Model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    lightning: lightningModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
    taro: taroModel,
  };
  const network = getNetwork(1, 'taro network', Status.Stopped, 2);
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
  const node = initialState.network.networks[0].nodes.taro[0] as TarodNode;

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections, initialState });

    taroServiceMock.listAssets.mockResolvedValue([
      defaultTaroAsset({
        name: 'my-asset',
        amount: '100',
      }),
    ]);
    taroServiceMock.listBalances.mockResolvedValue([
      defaultTaroBalance({
        name: 'my-asset',
        balance: '100',
      }),
    ]);
  });

  it('should have a valid initial state', () => {
    expect(store.getState().taro.nodes).toEqual({});
  });

  it('should update state with getAssets response', async () => {
    await store.getActions().taro.getAssets(node);
    const nodeState = store.getState().taro.nodes[node.name];
    expect(nodeState.assets).toBeDefined();
    const assets = nodeState.assets as PTARO.TaroAsset[];
    expect(assets[0].name).toEqual('my-asset');
    expect(assets[0].amount).toEqual('100');
  });

  it('should update state with getBalances response', async () => {
    await store.getActions().taro.getBalances(node);
    const nodeState = store.getState().taro.nodes[node.name];
    expect(nodeState.balances).toBeDefined();
    const balances = nodeState.balances as PTARO.TaroBalance[];
    expect(balances[0].name).toEqual('my-asset');
    expect(balances[0].balance).toEqual('100');
  });

  it('should update state with getAllInfo response', async () => {
    await store.getActions().taro.getAllInfo(node);
    const nodeState = store.getState().taro.nodes[node.name];
    expect(nodeState.balances).toBeDefined();
    const assets = nodeState.assets as PTARO.TaroAsset[];
    expect(assets[0].name).toEqual('my-asset');
    expect(assets[0].amount).toEqual('100');
    const balances = nodeState.balances as PTARO.TaroBalance[];
    expect(balances[0].name).toEqual('my-asset');
    expect(balances[0].balance).toEqual('100');
  });

  it('should mint an asset and mine on the first bitcoin node', async () => {
    taroServiceMock.mintAsset.mockResolvedValue(defaultTarodMintAsset());
    const { lightning, taro } = store.getState().network.networks[0].nodes;
    lightning[1].backendName = 'invalid';
    const payload: MintAssetPayload = {
      node: taro[1] as TarodNode,
      assetType: PTARO.TARO_ASSET_TYPE.NORMAL,
      name: 'my-asset',
      amount: 100,
      enableEmission: false,
      finalize: true,
      autoFund: false,
    };
    await store.getActions().taro.mintAsset(payload);
    expect(taroServiceMock.mintAsset).toHaveBeenCalledWith(
      taro[1],
      expect.objectContaining({ name: 'my-asset' }),
    );
    expect(bitcoindServiceMock.mine).toHaveBeenCalledWith(
      6,
      expect.objectContaining({ name: 'backend1' }),
    );
  });
});
