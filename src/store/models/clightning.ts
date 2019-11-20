import { Action, action, Thunk, thunk } from 'easy-peasy';
import { CLightningNode } from 'shared/types';
import * as CLN from 'lib/clightning/clightningTypes';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface CLightningNodeMapping {
  [key: string]: CLightningNodeModel;
}

export interface CLightningNodeModel {
  info?: CLN.GetInfoResponse;
}

export interface CLightningModel {
  nodes: CLightningNodeMapping;
  removeNode: Action<CLightningModel, string>;
  setInfo: Action<CLightningModel, { node: CLightningNode; info: CLN.GetInfoResponse }>;
  getInfo: Thunk<CLightningModel, CLightningNode, StoreInjections, RootModel>;
}

const lndModel: CLightningModel = {
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
    const info = await injections.clightningService.getInfo(node);
    actions.setInfo({ node, info });
  }),
};

export default lndModel;
