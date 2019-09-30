import { GetInfoResponse } from '@radar/lnrpc';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LndNode, StoreInjections } from 'types';

interface LndNodeModel {
  info?: GetInfoResponse | undefined;
}

export interface LndModel {
  nodes: { [key: string]: LndNodeModel };
  setInfo: Action<LndModel, { node: LndNode; info: GetInfoResponse }>;
  getInfo: Thunk<LndModel, LndNode, StoreInjections>;
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
};

export default lndModel;
