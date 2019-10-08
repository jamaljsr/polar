import * as LND from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LndNode, StoreInjections } from 'types';
import { delay } from 'utils/async';
import { BLOCKS_TIL_COMFIRMED } from 'utils/constants';
import { fromSatsNumeric } from 'utils/units';
import { RootModel } from './';

export interface LndNodeModel {
  info?: LND.GetInfoResponse | undefined;
  walletBalance?: LND.WalletBalanceResponse | undefined;
  channels?: {
    open?: LND.Channel[] | undefined;
    opening?: LND.PendingOpenChannel[] | undefined;
    closing?: LND.ClosedChannel[] | undefined;
    forceClosing?: LND.ForceClosedChannel[] | undefined;
    waitingClose?: LND.WaitingCloseChannel[] | undefined;
  };
}

export interface DepositFundsPayload {
  node: LndNode;
  sats: string;
}

export interface OpenChannelPayload {
  from: LndNode;
  to: LndNode;
  sats: string;
}

export interface LndModel {
  nodes: { [key: string]: LndNodeModel };
  setInfo: Action<LndModel, { node: LndNode; info: LND.GetInfoResponse }>;
  getInfo: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  setWalletBalance: Action<
    LndModel,
    { node: LndNode; balance: LND.WalletBalanceResponse }
  >;
  getWalletBalance: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  setChannels: Action<LndModel, { node: LndNode; channels: LndNodeModel['channels'] }>;
  getChannels: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  getAllInfo: Thunk<LndModel, LndNode, StoreInjections, RootModel>;
  depositFunds: Thunk<LndModel, DepositFundsPayload, StoreInjections, RootModel>;
  openChannel: Thunk<LndModel, OpenChannelPayload, StoreInjections, RootModel>;
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
  setChannels: action((state, { node, channels }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].channels = channels;
  }),
  getChannels: thunk(async (actions, node, { injections }) => {
    const open = await injections.lndService.listChannels(node);
    const pending = await injections.lndService.pendingChannels(node);
    const channels = {
      open: open.channels,
      opening: pending.pendingOpenChannels,
      closing: pending.pendingClosingChannels,
      forceClosing: pending.pendingForceClosingChannels,
      waitingClose: pending.waitingCloseChannels,
    };
    actions.setChannels({ node, channels });
  }),
  getAllInfo: thunk(async (actions, node) => {
    await actions.getInfo(node);
    await actions.getWalletBalance(node);
    await actions.getChannels(node);
  }),
  depositFunds: thunk(async (actions, { node, sats }, { injections, getStoreState }) => {
    const { nodes } = getStoreState().network.networkById(node.networkId);
    const bitcoin =
      nodes.bitcoin.find(n => n.name === node.backendName) || nodes.bitcoin[0];
    const { address } = await injections.lndService.getNewAddress(node);
    const coins = fromSatsNumeric(sats);
    await injections.bitcoindService.sendFunds(bitcoin, address, coins);
    // add a small delay to allow LND to process the mined blocks
    await delay(250);
    await actions.getWalletBalance(node);
  }),
  openChannel: thunk(
    async (actions, { from, to, sats }, { injections, getStoreState }) => {
      await injections.lndService.openChannel(from, to, sats);
      // mine some blocks to confirm the txn
      const node = getStoreState().network.networkById(from.networkId).nodes.bitcoin[0];
      await injections.bitcoindService.mine(BLOCKS_TIL_COMFIRMED, node.ports.rpc);
      // update balances for both nodes in state
      await actions.getAllInfo(to);
      await actions.getAllInfo(from);
    },
  ),
};

export default lndModel;
