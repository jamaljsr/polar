import * as TARO from '@hodlone/taro-api';
import { action, Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy';
import { BitcoinNode, LightningNode, Status, TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { StoreInjections } from 'types';
import { BLOCKS_TIL_CONFIRMED } from 'utils/constants';
import { RootModel } from './';

//This is the minimum balance that a taro node must have access to in order to mint assets
export const TARO_MIN_LND_BALANCE = 10000;

export interface TaroNodeMapping {
  [key: string]: TaroNodeModel;
}

export interface TaroNodeModel {
  assets?: PTARO.TaroAsset[];
  balances?: PTARO.TaroBalance[];
  assetRoots?: PTARO.TaroAssetRoot[];
}

export interface MintAssetPayload {
  node: TarodNode;
  assetType: PTARO.TARO_ASSET_TYPE.NORMAL | PTARO.TARO_ASSET_TYPE.COLLECTIBLE;
  name: string;
  amount: number;
  enableEmission: boolean;
  finalize: boolean;
  autoFund: boolean;
}

export interface SyncUniversePayload {
  node: TarodNode;
  hostname: string;
}

export interface NewAddressPayload {
  node: TarodNode;
  assetId: string;
  amount: string;
}

export interface SendAssetPayload {
  node: TarodNode;
  address: string;
  autoFund: boolean;
}

export interface DecodeAddressPayload {
  node: TarodNode;
  address: string;
}

export interface TaroModel {
  nodes: TaroNodeMapping;
  removeNode: Action<TaroModel, string>;
  clearNodes: Action<TaroModel, void>;
  setAssets: Action<TaroModel, { node: TaroNode; assets: PTARO.TaroAsset[] }>;
  getAssets: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  setBalances: Action<TaroModel, { node: TaroNode; balances: PTARO.TaroBalance[] }>;
  getBalances: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  setAssetRoots: Action<TaroModel, { node: TaroNode; roots: PTARO.TaroAssetRoot[] }>;
  getAssetRoots: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;

  getAllInfo: Thunk<TaroModel, TaroNode, RootModel>;
  mineListener: ThunkOn<TaroModel, StoreInjections, RootModel>;
  mintAsset: Thunk<TaroModel, MintAssetPayload, StoreInjections, RootModel>;
  syncUniverse: Thunk<
    TaroModel,
    SyncUniversePayload,
    StoreInjections,
    RootModel,
    Promise<number>
  >;
  getNewAddress: Thunk<
    TaroModel,
    NewAddressPayload,
    StoreInjections,
    RootModel,
    Promise<PTARO.TaroAddress>
  >;
  sendAsset: Thunk<TaroModel, SendAssetPayload, StoreInjections, RootModel>;
  decodeAddress: Thunk<
    TaroModel,
    DecodeAddressPayload,
    StoreInjections,
    RootModel,
    Promise<PTARO.TaroAddress>
  >;
}

const taroModel: TaroModel = {
  // state properties
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  removeNode: action((state, name) => {
    if (state.nodes[name]) {
      delete state.nodes[name];
    }
  }),
  clearNodes: action(state => {
    state.nodes = {};
  }),
  setAssets: action((state, { node, assets }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].assets = assets;
  }),
  getAssets: thunk(async (actions, node, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const assets = await api.listAssets(node);
    actions.setAssets({ node, assets });
  }),
  setBalances: action((state, { node, balances }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].balances = balances;
  }),
  getBalances: thunk(async (actions, node, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const balances = await api.listBalances(node);
    actions.setBalances({ node, balances });
  }),
  setAssetRoots: action((state, { node, roots }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].assetRoots = roots;
  }),
  getAssetRoots: thunk(async (actions, node, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const roots = await api.assetRoots(node);
    actions.setAssetRoots({ node, roots });
  }),
  getAllInfo: thunk(async (actions, node) => {
    await actions.getAssets(node);
    await actions.getBalances(node);
    await actions.getAssetRoots(node);
  }),

  mintAsset: thunk(
    async (actions, payload, { injections, getStoreState, getStoreActions }) => {
      const { node, assetType, name, amount, enableEmission, finalize, autoFund } =
        payload;

      const network = getStoreState().network.networkById(node.networkId);
      const lndNode = network.nodes.lightning.find(
        n => n.name === node.lndName,
      ) as LightningNode;
      // fund lnd node
      if (autoFund) {
        await getStoreActions().lightning.depositFunds({
          node: lndNode,
          sats: TARO_MIN_LND_BALANCE.toString(),
        });
      }

      // mint taro asset
      const api = injections.taroFactory.getService(node);

      const req: TARO.MintAssetRequestPartial = {
        asset: {
          assetType,
          name,
          amount:
            assetType === PTARO.TARO_ASSET_TYPE.COLLECTIBLE ? '1' : amount.toString(),
        },
        enableEmission,
      };
      const res = await api.mintAsset(node, req);

      // finalize asset
      if (finalize) {
        await api.finalizeBatch(node);

        // update network
        const btcNode =
          network.nodes.bitcoin.find(n => n.name === lndNode.backendName) ||
          network.nodes.bitcoin[0];
        // missing await is intentional, we don't have to wait for bitcoin to mine
        getStoreActions().bitcoind.mine({
          blocks: BLOCKS_TIL_CONFIRMED,
          node: btcNode,
        });
      }

      return res;
    },
  ),
  syncUniverse: thunk(async (actions, payload, { injections }) => {
    const { node, hostname } = payload;
    const api = injections.taroFactory.getService(node);
    const res = await api.syncUniverse(node, hostname);
    await actions.getAssetRoots(node);
    return res.syncedUniverses.length;
  }),
  getNewAddress: thunk(async (actions, payload, { injections }) => {
    const { node, assetId, amount } = payload;
    const api = injections.taroFactory.getService(node);
    return await api.newAddress(node, assetId, amount);
  }),
  sendAsset: thunk(
    async (
      actions,
      { node, address, autoFund },
      { injections, getStoreState, getStoreActions },
    ) => {
      const network = getStoreState().network.networkById(node.networkId);
      const lndNode = network.nodes.lightning.find(
        n => n.name === node.lndName,
      ) as LightningNode;
      // fund lnd node
      if (autoFund) {
        await getStoreActions().lightning.depositFunds({
          node: lndNode,
          sats: (2 * TARO_MIN_LND_BALANCE).toString(),
        });
      }
      const api = injections.taroFactory.getService(node);
      const sendReq: TARO.SendAssetRequestPartial = {
        taroAddrs: [address],
      };
      const res = await api.sendAsset(node, sendReq);
      //update network
      const btcNode: BitcoinNode = network.nodes.bitcoin[0];
      //missing await is intentional, we dont have to wait for bitcoin to mine
      getStoreActions().bitcoind.mine({
        blocks: BLOCKS_TIL_CONFIRMED,
        node: btcNode,
      });
      return res;
    },
  ),
  decodeAddress: thunk(async (actions, { node, address }, { injections }) => {
    const api = injections.taroFactory.getService(node);
    const sendReq: TARO.DecodeAddrRequestPartial = {
      addr: address,
    };
    const res = await api.decodeAddress(node, sendReq);
    return res;
  }),

  mineListener: thunkOn(
    (actions, storeActions) => storeActions.bitcoind.mine,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { notify } = getStoreActions().app;
      // update all lightning nodes info when a block in mined
      const network = getStoreState().network.networkById(payload.node.networkId);
      await getStoreActions().lightning.waitForNodes(network.nodes.lightning);
      await Promise.all(
        network.nodes.taro
          .filter(n => n.status === Status.Started)
          .map(async n => {
            try {
              await actions.getAllInfo(n);
            } catch (error: any) {
              notify({ message: `Unable to retrieve assets for ${n.name}`, error });
            }
          }),
      );
    },
  ),
};

export default taroModel;
