import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LitdNode } from 'shared/types';
import * as PLIT from 'lib/litd/types';
import { StoreInjections } from 'types';
import { RootModel } from './';

export interface LitNodeMapping {
  [key: string]: LitNodeModel;
}

export interface LitNodeModel {
  sessions?: PLIT.Session[];
}

export interface AddSessionPayload {
  node: LitdNode;
  label: string;
  type: PLIT.Session['type'];
  mailboxServerAddr?: string;
  expiresAt: number;
}

export interface RevokeSessionPayload {
  node: LitdNode;
  localPublicKey: string;
}

export interface LitModel {
  nodes: LitNodeMapping;
  removeNode: Action<LitModel, string>;
  clearNodes: Action<LitModel, void>;
  setSessions: Action<LitModel, { node: LitdNode; sessions: PLIT.Session[] }>;
  getSessions: Thunk<LitModel, LitdNode, StoreInjections, RootModel>;
  addSession: Thunk<
    LitModel,
    AddSessionPayload,
    StoreInjections,
    RootModel,
    Promise<PLIT.Session>
  >;
  revokeSession: Thunk<LitModel, RevokeSessionPayload, StoreInjections, RootModel>;
}

const litModel: LitModel = {
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
  setSessions: action((state, { node, sessions }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].sessions = sessions;
  }),
  getSessions: thunk(async (actions, node, { injections }) => {
    const sessions = await injections.litdService.listSessions(node);
    actions.setSessions({ node, sessions });
  }),
  addSession: thunk(async (actions, payload, { injections }) => {
    const { node, label, type, expiresAt, mailboxServerAddr } = payload;
    const session = await injections.litdService.addSession(
      node,
      label,
      type,
      expiresAt,
      mailboxServerAddr,
    );
    await actions.getSessions(node);
    return session;
  }),
  revokeSession: thunk(async (actions, { node, localPublicKey }, { injections }) => {
    await injections.litdService.revokeSession(node, localPublicKey);
    await actions.getSessions(node);
  }),
};

export default litModel;
