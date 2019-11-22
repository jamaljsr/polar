import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LightningNode } from 'shared/types';
import { LightningNodeBalances, LightningNodeInfo } from 'lib/lightning/types';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface LightningNodeMapping {
  [key: string]: LightningNodeModel;
}

export interface LightningNodeModel {
  info?: LightningNodeInfo;
  balances?: LightningNodeBalances;
}

export interface LightningModel {
  nodes: LightningNodeMapping;
  removeNode: Action<LightningModel, string>;
  setInfo: Action<LightningModel, { node: LightningNode; info: LightningNodeInfo }>;
  getInfo: Thunk<LightningModel, LightningNode, StoreInjections, RootModel>;
  setBalances: Action<
    LightningModel,
    { node: LightningNode; balances: LightningNodeBalances }
  >;
  getBalances: Thunk<LightningModel, LightningNode, StoreInjections, RootModel>;
}

const lightningModel: LightningModel = {
  // state properties
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  removeNode: action((state, name) => {
    if (state.nodes[name]) {
      delete state.nodes[name];
    }
  }),
  setInfo: action((state, { node, info }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].info = info;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const api = injections.lightningFactory.getService(node);
    const info = await api.getInfo(node);
    actions.setInfo({ node, info });
  }),
  setBalances: action((state, { node, balances }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].balances = balances;
  }),
  getBalances: thunk(async (actions, node, { injections }) => {
    const api = injections.lightningFactory.getService(node);
    const balances = await api.getBalances(node);
    actions.setBalances({ node, balances });
  }),
};

export default lightningModel;
