import { Action, action, Thunk, thunk } from 'easy-peasy';
import { CLightningNode } from 'shared/types';
import * as CLN from 'lib/clightning/clightningTypes';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface CLightningNodeMapping {
  [key: string]: CLightningNodeModel;
}

export interface CLightningNodeModel {
  info?: CLN.GetInfoResponse;
  balance?: CLN.GetBalanceResponse;
}

export interface CLightningModel {
  nodes: CLightningNodeMapping;
  removeNode: Action<CLightningModel, string>;
  setInfo: Action<CLightningModel, { node: CLightningNode; info: CLN.GetInfoResponse }>;
  getInfo: Thunk<CLightningModel, CLightningNode, StoreInjections, RootModel>;
  setBalance: Action<
    CLightningModel,
    { node: CLightningNode; balance: CLN.GetBalanceResponse }
  >;
  getBalance: Thunk<CLightningModel, CLightningNode, StoreInjections, RootModel>;
}

const lndModel: CLightningModel = {
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
    const info = await injections.clightningService.getInfo(node);
    actions.setInfo({ node, info });
  }),
  setBalance: action((state, { node, balance }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].balance = balance;
  }),
  getBalance: thunk(async (actions, node, { injections }) => {
    const balance = await injections.clightningService.getBalance(node);
    actions.setBalance({ node, balance });
  }),
};

export default lndModel;
