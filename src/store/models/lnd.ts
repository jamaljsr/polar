import { GetInfoResponse } from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LNDNode, StoreInjections } from 'types';

interface LndNodeModel {
  initialized: boolean;
  info?: GetInfoResponse | undefined;
}

export interface LndModel {
  nodes: { [key: string]: LndNodeModel };
  create: Action<LndModel, LNDNode>;
  connect: Thunk<LndModel, LNDNode, StoreInjections>;
  setInfo: Action<LndModel, { node: LNDNode; info: GetInfoResponse }>;
  getInfo: Thunk<LndModel, LNDNode, StoreInjections>;
}

const lndModel: LndModel = {
  // state properties
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  create: action((state, node) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = { initialized: true };
  }),
  connect: thunk(async (actions, node, { injections }) => {
    await injections.lndService.connect(node);
    actions.create(node);
  }),
  setInfo: action((state, { node, info }) => {
    if (!state.nodes[node.name])
      throw new Error(`Node '${node.name}' has not been started.`);
    state.nodes[node.name].info = info;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const info = await injections.lndService.getInfo(node);
    actions.setInfo({ node, info });
  }),
};

export default lndModel;
