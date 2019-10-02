import { GetInfoResponse, WalletBalanceResponse } from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LndNode, StoreInjections } from 'types';
import { delay } from 'utils/async';
import { RootModel } from './';

interface LndNodeModel {
  info?: GetInfoResponse | undefined;
  walletBalance?: WalletBalanceResponse | undefined;
}

interface DepositFundsPayload {
  node: LndNode;
  amount: number;
}

export interface LndModel {
  nodes: { [key: string]: LndNodeModel };
  setInfo: Action<LndModel, { node: LndNode; info: GetInfoResponse }>;
  getInfo: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  setWalletBalance: Action<LndModel, { node: LndNode; balance: WalletBalanceResponse }>;
  getWalletBalance: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  depositFunds: Thunk<LndModel, DepositFundsPayload, StoreInjections, RootModel>;
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
  depositFunds: thunk(
    async (actions, { node, amount }, { injections, getStoreState }) => {
      if (amount < 0) {
        throw new Error('The amount must be a positve number');
      }
      const { nodes } = getStoreState().network.networkById(node.networkId);
      const bitcoin =
        nodes.bitcoin.find(n => n.name === node.backendName) || nodes.bitcoin[0];
      const { address } = await injections.lndService.getNewAddress(node);
      await injections.bitcoindService.sendFunds(bitcoin, address, amount);
      // add a small delay to allow LND to process the mined blocks
      await delay(250);
      await actions.getWalletBalance(node);
    },
  ),
};

export default lndModel;
