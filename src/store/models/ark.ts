import { Action, action, Thunk, thunk } from 'easy-peasy';
import * as PLN from 'lib/ark/types';
import { ArkNode } from 'shared/types';
import { StoreInjections } from 'types';
import { delay } from 'utils/async';
import { RootModel } from '.';

export interface ArkNodeMapping {
  [key: string]: ArkNodeModel;
}

export interface ArkNodeModel {
  info?: PLN.ArkNodeInfo;
  walletBalance?: PLN.ArkNodeBalances;
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
  setInfo: Action<ArkModel, { node: ArkNode; info: PLN.ArkNodeInfo }>;
  getInfo: Thunk<ArkModel, ArkNode, StoreInjections, RootModel>;
  getAllInfo: Thunk<ArkModel, ArkNode, StoreInjections, RootModel>;
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
  waitForNodes: thunk(async (actions, nodes) => {
    // TODO: move this check into the delay() func
    if (process.env.NODE_ENV === 'test') return;
    // mapping of the number of seconds to wait for each implementation
    const nodeDelays: Record<ArkNode['implementation'], number> = {
      arkd: 1,
    };
    // determine the highest delay of all implementations
    const longestDelay = nodes.reduce(
      (d, node) => Math.max(d, nodeDelays[node.implementation]),
      0,
    );
    await delay(longestDelay * 1000);
  }),
};

export default arkModel;
