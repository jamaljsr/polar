import * as LND from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LndNode } from 'shared/types';
import { LightningNodeInfo } from 'lib/lightning/types';
import { StoreInjections } from 'types';
import { delay } from 'utils/async';
import { BLOCKS_TIL_COMFIRMED } from 'utils/constants';
import { fromSatsNumeric } from 'utils/units';
import { RootModel } from './';

export interface LndNodeMapping {
  [key: string]: LndNodeModel;
}

export interface LndNodeModel {
  info?: LightningNodeInfo;
  walletBalance?: LND.WalletBalanceResponse;
  channels?: {
    open: LND.Channel[];
    opening: LND.PendingOpenChannel[];
    closing: LND.ClosedChannel[];
    forceClosing: LND.ForceClosedChannel[];
    waitingClose: LND.WaitingCloseChannel[];
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
  autoFund: boolean;
}

export interface LndModel {
  nodes: LndNodeMapping;
  removeNode: Action<LndModel, string>;
  setInfo: Action<LndModel, { node: LndNode; info: LightningNodeInfo }>;
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
  closeChannel: Thunk<
    LndModel,
    { node: LndNode; channelPoint: string },
    StoreInjections,
    RootModel
  >;
}

const lndModel: LndModel = {
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
    async (
      actions,
      { from, to, sats, autoFund },
      { injections, getStoreState, getStoreActions },
    ) => {
      // automatically deposit funds when the node doesn't have enough to open the channel
      if (autoFund) {
        const fund = (parseInt(sats) * 2).toString();
        await actions.depositFunds({ node: from, sats: fund });
      }
      // open the channel via LND
      await injections.lndService.openChannel(from, to, sats);
      // mine some blocks to confirm the txn
      const network = getStoreState().network.networkById(from.networkId);
      const node = network.nodes.bitcoin[0];
      await injections.bitcoindService.mine(BLOCKS_TIL_COMFIRMED, node.ports.rpc);
      // add a small delay to allow LND to process the mined blocks
      await delay(250);
      // synchronize the chart with the new channel
      await getStoreActions().designer.syncChart(network);
      getStoreActions().designer.redrawChart();
    },
  ),
  closeChannel: thunk(
    async (
      actions,
      { node, channelPoint },
      { injections, getStoreState, getStoreActions },
    ) => {
      await injections.lndService.closeChannel(node, channelPoint);
      // mine some blocks to confirm the txn
      const network = getStoreState().network.networkById(node.networkId);
      const bitcoinNode = network.nodes.bitcoin[0];
      await injections.bitcoindService.mine(1, bitcoinNode.ports.rpc);
      // TODO: remove these delays once LND streaming updates are implemented
      await delay(250);
      await injections.bitcoindService.mine(1, bitcoinNode.ports.rpc);
      // add a small delay to allow LND to process the mined blocks
      await delay(250);
      // synchronize the chart with the new channel
      await getStoreActions().designer.syncChart(network);
      getStoreActions().designer.redrawChart();
    },
  ),
};

export default lndModel;
