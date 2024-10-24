import { Action, action, Thunk, thunk } from 'easy-peasy';
import { LitdNode } from 'shared/types';
import * as PLN from 'lib/lightning/types';
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

export interface PayInvoicePayload {
  node: LitdNode;
  assetId: string;
  invoice: string;
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
    Promise<{ invoice: string; sats: number }> // returns the payment request and sats amount
  >;
  payAssetInvoice: Thunk<
    LitModel,
    PayInvoicePayload,
    StoreInjections,
    RootModel,
    Promise<PLN.LightningNodePayReceipt>
  >;
  getAssetsInChannels: Thunk<
    LitModel,
    { nodeName: string },
    StoreInjections,
    RootModel,
    { asset: PLN.LightningNodeChannelAsset; peerPubkey: string }[]
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
    async (actions, { node, assetId, amount }, { injections }) => {
      const assetsInChannels = actions
        .getAssetsInChannels({ nodeName: node.name })
        .filter(a => a.asset.id === assetId)
        .filter(a => BigInt(a.asset.remoteBalance) >= BigInt(amount));

      if (assetsInChannels.length === 0) {
        throw new Error('Not enough assets in a channel to create the invoice');
      }

      // create the invoice using the TAPD RPC
      const tapdNode = mapToTapd(node);
      const invoice = await injections.tapFactory
        .getService(tapdNode)
        .addInvoice(tapdNode, assetId, amount, '', 3600);

      // decode the invoice to get the amount in sats
      const decoded = await injections.lightningFactory
        .getService(node)
        .decodeInvoice(node, invoice);
      const sats = Number(decoded.amountMsat) / 1000;

      return { invoice, sats };
    },
  ),
  payAssetInvoice: thunk(
    async (
      actions,
      { node, assetId, invoice },
      { injections, getStoreState, getStoreActions },
    ) => {
      const assetsInChannels = actions
        .getAssetsInChannels({ nodeName: node.name })
        .filter(a => a.asset.id === assetId);

      if (assetsInChannels.length === 0) {
        throw new Error('Not enough assets in a channel to pay the invoice');
      }

      // decode the invoice to get the amount in msats
      const lndService = injections.lightningFactory.getService(node);
      const decoded = await lndService.decodeInvoice(node, invoice);
      const amtMsat = Number(decoded.amountMsat);

      // mimics the behavior of the LND CLI, which will use 5% of the amount if it's
      // greater than 1,000 sats, otherwise it will use the full amount
      const feeLimit = Math.floor(amtMsat > 1_000_000 ? amtMsat * 0.05 : amtMsat);
      const peerPubkey = assetsInChannels[0].peerPubkey;

      const tapdNode = mapToTapd(node);
      const tapService = injections.tapFactory.getService(tapdNode);
      const receipt = await tapService.sendPayment(
        tapdNode,
        assetId,
        invoice,
        feeLimit,
        peerPubkey,
      );

      // synchronize the chart with the new channel
      const network = getStoreState().network.networkById(node.networkId);
      await getStoreActions().lightning.waitForNodes(network.nodes.lightning);
      await getStoreActions().designer.syncChart(network);

      return receipt;
    },
  ),
  getAssetsInChannels: thunk((actions, { nodeName }, { getStoreState }) => {
    const assets: {
      asset: PLN.LightningNodeChannelAsset;
      peerPubkey: string;
    }[] = [];

    // helper function to add an asset to the list
    const addAsset = (asset: PLN.LightningNodeChannelAsset, peerPubkey: string) => {
      const existing = assets.find(a => a.asset.id === asset.id);
      if (existing) {
        // if the existing asset has a lower balance, replace it
        if (BigInt(asset.localBalance) > BigInt(existing.asset.localBalance)) {
          existing.asset = asset;
          existing.peerPubkey = peerPubkey;
        }
      } else {
        assets.push({ asset, peerPubkey });
      }
    };

    const { nodes } = getStoreState().lightning;
    Object.entries(nodes).forEach(([name, data]) => {
      if (!data.channels) return;
      if (name === nodeName) {
        // loop over channels for the provided node
        data.channels.forEach(c => {
          c.assets?.forEach(asset => addAsset(asset, c.pubkey));
        });
      } else {
        // loop over channels from other nodes
        const nodePubkey = nodes[nodeName]?.info?.pubkey;
        data.channels
          // exclude channels that are not with the provided node
          .filter(c => c.pubkey === nodePubkey)
          .forEach(c => {
            const remotePubkey = data.info?.pubkey;
            if (!remotePubkey) return;
            c.assets?.forEach(asset => {
              const swapped = {
                id: asset.id,
                name: asset.name,
                capacity: asset.capacity,
                // swap the local and remote balances because we are looking at the
                // channel from the other node's perspective
                localBalance: asset.remoteBalance,
                remoteBalance: asset.localBalance,
              };
              addAsset(swapped, remotePubkey);
            });
          });
      }
    });

    return assets;
  }),
};

export default litModel;
