import { action, Action, thunk, Thunk, thunkOn, ThunkOn } from 'easy-peasy';
import { Status, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface TaroNodeMapping {
  [key: string]: TaroNodeModel;
}

export interface TaroNodeModel {
  assets?: PTARO.TaroAsset[];
  balances?: PTARO.TaroBalance[];
}

export interface TaroModel {
  nodes: TaroNodeMapping;
  removeNode: Action<TaroModel, string>;
  clearNodes: Action<TaroModel, void>;
  setAssets: Action<TaroModel, { node: TaroNode; assets: PTARO.TaroAsset[] }>;
  getAssets: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  setBalances: Action<TaroModel, { node: TaroNode; balances: PTARO.TaroBalance[] }>;
  getBalances: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
  mineListener: ThunkOn<TaroModel, StoreInjections, RootModel>;
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
              await actions.getAssets(n);
            } catch (error: any) {
              notify({ message: `Unable to retrieve assets for ${n.name}`, error });
            }
          }),
      );
    },
  ),
};

export default taroModel;
