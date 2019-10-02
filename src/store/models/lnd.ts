import { GetInfoResponse, WalletBalanceResponse } from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LndNode, StoreInjections } from 'types';

interface LndNodeModel {
  info?: GetInfoResponse | undefined;
  walletBalance?: WalletBalanceResponse | undefined;
}

export interface LndModel {
  nodes: { [key: string]: LndNodeModel };
  setInfo: Action<LndModel, { node: LndNode; info: GetInfoResponse }>;
  getInfo: Thunk<LndModel, LndNode, StoreInjections>;
  setWalletBalance: Action<LndModel, { node: LndNode; balance: WalletBalanceResponse }>;
  getWalletBalance: Thunk<LndModel, LndNode, StoreInjections>;
}

const lndModel: LndModel = {
  // state properties
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  setInfo: action((state, { node, info }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].info = info;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const info = await injections.lndService.getInfo(node);
    actions.setInfo({ node, info });
  }),
  setWalletBalance: action((state, { node, balance }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].walletBalance = balance;
  }),
  getWalletBalance: thunk(async (actions, node, { injections }) => {
    const balance = await injections.lndService.getWalletBalance(node);
    actions.setWalletBalance({ node, balance });
  }),
};

export default lndModel;
