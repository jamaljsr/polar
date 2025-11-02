import { Action, action, Thunk, thunk, thunkOn, ThunkOn } from 'easy-peasy';
import * as PLA from 'lib/ark/types';
import { ArkNode, Status } from 'shared/types';
import { StoreInjections } from 'types';
import type { RootModel } from '.';
import { error } from 'electron-log';
import deepmerge from 'deepmerge';
import { debug } from 'electron-log';
import { delay } from 'utils/async';

export interface ArkNodeMapping {
  [key: string]: ArkNodeModel;
}

export interface ArkNodeModel {
  boardingAddress?: string;
  info?: PLA.ArkGetInfo;
  walletBalance?: PLA.ArkGetBalance;
  walletStatus?: PLA.ArkGetWalletStatus;
}

export interface DepositFundsPayload {
  node: ArkNode;
  sats: string;
}

export interface OpenChannelPayload {
  from: ArkNode;
  to: ArkNode;
  sats: string;
  autoFund: boolean;
  isPrivate: boolean;
}

export interface CreateInvoicePayload {
  node: ArkNode;
  amount: number;
  memo?: string;
}

export interface PayInvoicePayload {
  node: ArkNode;
  invoice: string;
  amount?: number;
}

export interface ArkModel {
  nodes: ArkNodeMapping;
  removeNode: Action<ArkModel, string>;
  clearNodes: Action<ArkModel, void>;
  setNodeInfo: Action<ArkModel, { node: ArkNode; nodeInfo: Partial<ArkNodeModel> }>;
  getInfo: Thunk<ArkModel, ArkNode, StoreInjections, RootModel>;
  getAllInfo: Thunk<ArkModel, ArkNode, StoreInjections, RootModel>;
  initializeWallet: Thunk<ArkModel, ArkNode, StoreInjections, RootModel>;
  mineListener: ThunkOn<ArkModel, StoreInjections, RootModel>;
  waitForNodes: Thunk<ArkModel, ArkNode[], StoreInjections, RootModel>;
}

const arkModel: ArkModel = {
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
  setNodeInfo: action((state, { node, nodeInfo }) => {
    state.nodes[node.name] = deepmerge(state.nodes[node.name] || {}, nodeInfo);
  }),
  initializeWallet: thunk(
    async (actions, node, { injections, getState, getStoreActions, getStoreState }) => {
      const api = injections.arkFactory.getService(node),
        currentState = getState(),
        { notify } = getStoreActions().app;

      try {
        const currentNodeState = currentState.nodes[node.name] || {};

        if (currentNodeState.walletStatus?.initialized || currentNodeState.info?.pubkey) {
          return;
        }

        debug(`Initializing wallet for ${node.name}`);

        let [walletStatus, info] = await Promise.all([
          await api.getWalletStatus(),
          await api.getInfo().catch(() => currentNodeState.info),
        ]);
        if (walletStatus.initialized && info?.pubkey) {
          actions.setNodeInfo({ node, nodeInfo: { walletStatus, info } });
          return;
        }

        const { bitcoin } = getStoreActions(),
          bitcoinNodes = getStoreState().network.networkById(node.networkId).nodes
            .bitcoin;
        // HACK: Mine a block after creating the wallet to help sync
        delay(500).then(() => bitcoin.mine({ blocks: 1, node: bitcoinNodes[0] }));

        walletStatus = await api.initWallet();
        info = await api.getInfo();
        actions.setNodeInfo({ node, nodeInfo: { walletStatus, info } });
      } catch (err: any) {
        notify({
          message: `Failed to initialize wallet for ${node.name}: ${
            err?.message || 'Unknown error'
          }`,
          error: err,
        });
      }
    },
  ),
  getInfo: thunk(async (actions, node, { injections, getState }) => {
    const api = injections.arkFactory.getService(node),
      currentState = getState();
    try {
      const currentNode = currentState.nodes[node.name] || {};
      if (!currentNode.walletStatus?.initialized) {
        await actions.initializeWallet(node);
      }
      const [info, walletStatus, walletBalance] = await Promise.all([
        api.getInfo().catch(() => currentNode.info),
        api.getWalletStatus().catch(() => currentNode.walletStatus),
        api.getWalletBalance().catch(() => currentNode.walletBalance),
      ]);
      const boardingAddress = info
        ? await api.getBoardingAddress(info.pubkey)
        : currentNode.boardingAddress;
      actions.setNodeInfo({
        node,
        nodeInfo: { info, walletStatus, walletBalance, boardingAddress },
      });
    } catch (err) {
      error('Failed to get ark info', err);
    }
  }),
  getAllInfo: thunk(async (actions, node) => {
    await actions.getInfo(node);
  }),
  mineListener: thunkOn(
    (actions, storeActions) => storeActions.bitcoin.mine,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { notify } = getStoreActions().app;
      // update all ark nodes info when a block in mined
      const network = getStoreState().network.networkById(payload.node.networkId);

      await actions.waitForNodes(network.nodes.ark);
      await Promise.all(
        network.nodes.ark
          .filter(n => n.status === Status.Started)
          .map(async n => {
            try {
              await actions.getAllInfo(n);
            } catch (error: any) {
              notify({ message: `Unable to retrieve node info from ${n.name}`, error });
            }
          }),
      );
    },
  ),
  waitForNodes: thunk(async (actions, nodes, { injections, getState }) => {
    if (process.env.NODE_ENV === 'test') return;

    await Promise.all(
      nodes.map(async node => {
        const api = injections.arkFactory.getService(node);
        await api.waitUntilOnline();

        // ensure we have the object set
        actions.setNodeInfo({ node, nodeInfo: {} });
        const state = getState(),
          nodeState = state.nodes[node.name];

        if (!nodeState.walletStatus?.initialized) {
          await actions.initializeWallet(node);
        }
      }),
    );
  }),
};

export default arkModel;
