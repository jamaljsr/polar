import * as TAP from '@lightningpolar/tapd-api';
import { action, Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy';
import { BitcoinNode, LightningNode, Status, TapdNode, TapNode } from 'shared/types';
import * as PTAP from 'lib/tap/types';
import { StoreInjections } from 'types';
import { delay } from 'utils/async';
import { BLOCKS_TIL_CONFIRMED } from 'utils/constants';
import { RootModel } from './';

//This is the minimum balance that a tap node must have access to in order to mint assets
export const TAP_MIN_LND_BALANCE = 10000;

export interface TapNodeMapping {
  [key: string]: TapNodeModel;
}

export interface TapNodeModel {
  assets?: PTAP.TapAsset[];
  balances?: PTAP.TapBalance[];
  assetRoots?: PTAP.TapAssetRoot[];
}

export interface MintAssetPayload {
  node: TapdNode;
  assetType: PTAP.TAP_ASSET_TYPE.NORMAL | PTAP.TAP_ASSET_TYPE.COLLECTIBLE;
  name: string;
  amount: number;
  enableEmission: boolean;
  finalize: boolean;
  autoFund: boolean;
}

export interface SyncUniversePayload {
  node: TapdNode;
  hostname: string;
}

export interface NewAddressPayload {
  node: TapdNode;
  assetId: string;
  amount: string;
}

export interface SendAssetPayload {
  node: TapdNode;
  address: string;
  autoFund: boolean;
}

export interface DecodeAddressPayload {
  node: TapdNode;
  address: string;
}

export interface TapModel {
  nodes: TapNodeMapping;
  removeNode: Action<TapModel, string>;
  clearNodes: Action<TapModel, void>;
  setAssets: Action<TapModel, { node: TapNode; assets: PTAP.TapAsset[] }>;
  getAssets: Thunk<TapModel, TapNode, StoreInjections, RootModel>;
  setBalances: Action<TapModel, { node: TapNode; balances: PTAP.TapBalance[] }>;
  getBalances: Thunk<TapModel, TapNode, StoreInjections, RootModel>;
  setAssetRoots: Action<TapModel, { node: TapNode; roots: PTAP.TapAssetRoot[] }>;
  getAssetRoots: Thunk<TapModel, TapNode, StoreInjections, RootModel>;

  getAllInfo: Thunk<TapModel, TapNode, RootModel>;
  mineListener: ThunkOn<TapModel, StoreInjections, RootModel>;
  mintAsset: Thunk<TapModel, MintAssetPayload, StoreInjections, RootModel>;
  syncUniverse: Thunk<
    TapModel,
    SyncUniversePayload,
    StoreInjections,
    RootModel,
    Promise<number>
  >;
  getNewAddress: Thunk<
    TapModel,
    NewAddressPayload,
    StoreInjections,
    RootModel,
    Promise<PTAP.TapAddress>
  >;
  sendAsset: Thunk<TapModel, SendAssetPayload, StoreInjections, RootModel>;
  decodeAddress: Thunk<
    TapModel,
    DecodeAddressPayload,
    StoreInjections,
    RootModel,
    Promise<PTAP.TapAddress>
  >;
}

const tapModel: TapModel = {
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
    const api = injections.tapFactory.getService(node);
    const assets = await api.listAssets(node);
    actions.setAssets({ node, assets });
  }),
  setBalances: action((state, { node, balances }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].balances = balances;
  }),
  getBalances: thunk(async (actions, node, { injections }) => {
    const api = injections.tapFactory.getService(node);
    const balances = await api.listBalances(node);
    actions.setBalances({ node, balances });
  }),
  setAssetRoots: action((state, { node, roots }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].assetRoots = roots;
  }),
  getAssetRoots: thunk(async (actions, node, { injections }) => {
    const api = injections.tapFactory.getService(node);
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
          sats: TAP_MIN_LND_BALANCE.toString(),
        });
      }

      // mint tap asset
      const api = injections.tapFactory.getService(node);

      const req: TAP.MintAssetRequestPartial = {
        asset: {
          assetType,
          name,
          amount: assetType === PTAP.TAP_ASSET_TYPE.COLLECTIBLE ? '1' : amount.toString(),
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
    const api = injections.tapFactory.getService(node);
    const res = await api.syncUniverse(node, hostname);
    await actions.getAssetRoots(node);
    return res.syncedUniverses.length;
  }),
  getNewAddress: thunk(async (actions, payload, { injections }) => {
    const { node, assetId, amount } = payload;
    const api = injections.tapFactory.getService(node);
    return await api.newAddress(node, assetId, amount);
  }),
  sendAsset: thunk(
    async (
      actions,
      { node, address, autoFund },
      { injections, getState, getStoreState, getStoreActions },
    ) => {
      const network = getStoreState().network.networkById(node.networkId);
      const lndNode = network.nodes.lightning.find(
        n => n.name === node.lndName,
      ) as LightningNode;
      // fund lnd node
      if (autoFund) {
        await getStoreActions().lightning.depositFunds({
          node: lndNode,
          sats: (2 * TAP_MIN_LND_BALANCE).toString(),
        });
      }
      const api = injections.tapFactory.getService(node);
      const sendReq: TAP.SendAssetRequestPartial = {
        tapAddrs: [address],
      };
      const res = await api.sendAsset(node, sendReq);
      // update network
      const btcNode: BitcoinNode = network.nodes.bitcoin[0];
      await getStoreActions().bitcoind.mine({
        blocks: BLOCKS_TIL_CONFIRMED,
        node: btcNode,
      });

      // sending assets takes a few seconds before it's reflected in the
      // balance, so fetch balances until the balance changes for up to
      // 10 seconds
      const { id } = await actions.decodeAddress({ node, address });
      const currentBalance = getState().nodes[node.name]?.balances?.find(
        b => b.id === id,
      )?.balance;
      for (let i = 0; i < 10; i++) {
        await actions.getAllInfo(node);
        const newBalance = getState().nodes[node.name]?.balances?.find(
          b => b.id === id,
        )?.balance;
        if (newBalance !== currentBalance) break;
        await delay(1000);
      }
      return res;
    },
  ),
  decodeAddress: thunk(async (actions, { node, address }, { injections }) => {
    const api = injections.tapFactory.getService(node);
    const sendReq: TAP.DecodeAddrRequestPartial = {
      addr: address,
    };
    const res = await api.decodeAddress(node, sendReq);
    return res;
  }),
  mineListener: thunkOn(
    (actions, storeActions) => storeActions.bitcoind.mine,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { notify } = getStoreActions().app;
      // update all tap nodes info when a block in mined
      const network = getStoreState().network.networkById(payload.node.networkId);
      await getStoreActions().lightning.waitForNodes(network.nodes.lightning);
      await Promise.all(
        network.nodes.tap
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

export default tapModel;
