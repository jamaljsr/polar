import { action, Action, thunk, Thunk } from 'easy-peasy';
import { TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface TaroNodeMapping {
  [key: string]: TaroNodeModel;
}

export interface TaroNodeModel {
  assets?: PTARO.TaroAsset[];
}

export interface TaroModel {
  nodes: TaroNodeMapping;
  removeNode: Action<TaroModel, string>;
  clearNodes: Action<TaroModel, void>;
  setAssets: Action<TaroModel, { node: TaroNode; assets: PTARO.TaroAsset[] }>;
  getAssets: Thunk<TaroModel, TaroNode, StoreInjections, RootModel>;
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
};

export default taroModel;
