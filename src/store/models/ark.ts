import { Action, action, Thunk, thunk, thunkOn, ThunkOn } from 'easy-peasy';
import * as PLA from 'lib/ark/types';
import { ArkNode, Status } from 'shared/types';
import { StoreInjections } from 'types';
import type { RootModel } from '.';

export interface ArkNodeMapping {
  [key: string]: ArkNodeModel;
}

export interface ArkNodeModel {
  info?: PLA.ArkGetInfo;
  walletBalance?: PLA.ArkGetBalance;
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
  setInfo: Action<ArkModel, { node: ArkNode; info: PLA.ArkGetInfo }>;
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
  setInfo: action((state, { node, info }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].info = info;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const api = injections.arkFactory.getService(node);
    const info = await api.getInfo(node);
    actions.setInfo({ node, info });
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
  waitForNodes: thunk(async (actions, nodes, { injections }) => {
    if (process.env.NODE_ENV === 'test') return;

    await Promise.all(
      nodes.map(n => {
        const api = injections.arkFactory.getService(n);
        return api.waitUntilOnline(n);
      }),
    );
  }),
};

export default arkModel;
