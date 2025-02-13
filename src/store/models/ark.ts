import { Action, action, Thunk, thunk, thunkOn, ThunkOn } from 'easy-peasy';
import * as PLA from 'lib/ark/types';
import { ArkNode, Status } from 'shared/types';
import { StoreInjections } from 'types';
import type { RootModel } from '.';
import { error } from 'electron-log';
import deepmerge from 'deepmerge';

export interface ArkNodeMapping {
  [key: string]: ArkNodeModel;
}

export interface ArkNodeModel {
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
  getInfo: thunk(async (actions, node, { injections, getState }) => {
    const api = injections.arkFactory.getService(node),
      currentState = getState();
    try {
      const [info, walletStatus, walletBalance] = await Promise.all([
        api.getInfo().catch(() => currentState.nodes[node.name].info),
        api.getWalletStatus().catch(() => currentState.nodes[node.name].walletStatus),
        api.getWalletBalance().catch(() => currentState.nodes[node.name].walletBalance),
      ]);
      actions.setNodeInfo({ node, nodeInfo: { info, walletStatus, walletBalance } });
    } catch (err) {
      error('Failed to get ark info', err);
    }
  }),
  getAllInfo: thunk(async (actions, node, { getStoreActions }) => {
    const { notify } = getStoreActions().app;
    notify({ message: `getAllInfo` });
    await actions.getInfo(node);
  }),
  mineListener: thunkOn(
    (actions, storeActions) => storeActions.bitcoin.mine,
    async (actions, { payload }, { getStoreState, getStoreActions }) => {
      const { notify } = getStoreActions().app;
      // update all ark nodes info when a block in mined
      const network = getStoreState().network.networkById(payload.node.networkId);
      notify({ message: `mine listener` });

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
  waitForNodes: thunk(
    async (actions, nodes, { injections, getStoreActions, getState }) => {
      if (process.env.NODE_ENV === 'test') return;
      const { notify } = getStoreActions().app;
      notify({ message: `wait for nodes` });

      await Promise.all(
        nodes.map(async node => {
          const api = injections.arkFactory.getService(node);
          await api.waitUntilOnline();

          // ensure we have the object set
          actions.setNodeInfo({ node, nodeInfo: {} });
          const state = getState(),
            nodeState = state.nodes[node.name];

          if (nodeState.walletStatus && nodeState.walletStatus.initialized) return;

          let walletStatus = await api.getWalletStatus();
          if (walletStatus.initialized) {
            actions.setNodeInfo({ node, nodeInfo: { walletStatus } });
            return;
          }

          walletStatus = await api.initWallet();

          notify({
            message: `Wallet status for node ${node.name}: ${JSON.stringify(
              walletStatus,
            )}`,
          });
        }),
      );
    },
  ),
};

export default arkModel;
