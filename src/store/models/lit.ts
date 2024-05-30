import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LitdNode } from 'shared/types';
import * as PLIT from 'lib/litd/types';
import { StoreInjections } from 'types';
import { mapToTapd } from 'utils/network';
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

export interface CreateInvoicePayload {
  node: LitdNode;
  assetId: string;
  amount: number;
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
  createAssetInvoice: Thunk<
    LitModel,
    CreateInvoicePayload,
    StoreInjections,
    RootModel,
    Promise<string> // returns the payment request
  >;
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
  createAssetInvoice: thunk(
    async (actions, { node, assetId, amount }, { injections, getStoreState }) => {
      let peerPubkey = '';
      // The store only contains channels opened by each node. In order to find asset
      // channels opened by other nodes, we have to iterate over all nodes and their
      // channels.
      Object.entries(getStoreState().lightning.nodes).forEach(([name, data]) => {
        if (!data.channels) return;
        if (name === node.name) {
          data.channels.forEach(c => {
            const chanAsset = c.assets?.find(a => a.id === assetId);
            if (chanAsset && BigInt(chanAsset.remoteBalance) >= BigInt(amount)) {
              // set the peer pubkey to the channel's peer
              peerPubkey = c.pubkey;
            }
          });
        } else {
          const pubkey = getStoreState().lightning.nodes[node.name]?.info?.pubkey;
          data.channels
            .filter(c => c.pubkey === pubkey) // exclude channels that are not with the node
            .forEach(c => {
              const chanAsset = c.assets?.find(a => a.id === assetId);
              if (chanAsset && BigInt(chanAsset.localBalance) >= BigInt(amount)) {
                // set the peer pubkey to the channel's peer
                const chanPubkey = data.info?.pubkey;
                if (chanPubkey) peerPubkey = chanPubkey;
              }
            });
        }
      });

      if (!peerPubkey) {
        throw new Error('Not enough assets in a channel to create the invoice');
      }

      // create a buy order with the channel peer for the asset
      const tapdNode = mapToTapd(node);
      const buyOrder = await injections.tapFactory
        .getService(tapdNode)
        .addAssetBuyOrder(tapdNode, peerPubkey, assetId, amount);
      // calculate the amount of msats for the invoice
      const msatPerUnit = BigInt(buyOrder.askPrice);
      const msats = BigInt(amount) * msatPerUnit;
      // create the invoice
      const invoice = await injections.lightningFactory
        .getService(node)
        .createInvoice(node, amount, '', {
          nodeId: peerPubkey,
          chanId: buyOrder.scid,
          msats: msats.toString(),
        });
      return invoice;
    },
  ),
};

export default litModel;
