import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode, Status } from 'shared/types';
import { StoreInjections } from 'types';
import { delay } from 'utils/async';
import { prefixTranslation } from 'utils/translate';
import { RootModel } from './';

const { l } = prefixTranslation('store.models.bitcoind');

export interface BitcoindNodeMapping {
  [key: string]: BitcoindNodeModel;
}

export interface BitcoindNodeModel {
  chainInfo?: ChainInfo;
  walletInfo?: WalletInfo;
}

export interface BitcoindModel {
  nodes: BitcoindNodeMapping;
  removeNode: Action<BitcoindModel, string>;
  clearNodes: Action<BitcoindModel, void>;
  setInfo: Action<
    BitcoindModel,
    { node: BitcoinNode; chainInfo: ChainInfo; walletInfo: WalletInfo }
  >;
  getInfo: Thunk<BitcoindModel, BitcoinNode, StoreInjections>;
  mine: Thunk<
    BitcoindModel,
    { blocks: number; node: BitcoinNode },
    StoreInjections,
    RootModel
  >;
  mineFirstBlock: Thunk<BitcoindModel, BitcoinNode, StoreInjections, RootModel>;
}

const bitcoindModel: BitcoindModel = {
  // computed properties/functions
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  removeNode: action((state, name) => {
    delete state.nodes[name];
  }),
  clearNodes: action(state => {
    state.nodes = {};
  }),
  setInfo: action((state, { node, chainInfo, walletInfo }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].chainInfo = chainInfo;
    state.nodes[node.name].walletInfo = walletInfo;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const chainInfo = await injections.bitcoindService.getBlockchainInfo(node);
    const walletInfo = await injections.bitcoindService.getWalletInfo(node);
    actions.setInfo({ node, chainInfo, walletInfo });
  }),
  mine: thunk(async (actions, { blocks, node }, { injections, getStoreState }) => {
    if (blocks < 0) throw new Error(l('mineError'));

    await injections.bitcoindService.mine(blocks, node);
    // add a small delay to allow the block to propagate to all nodes
    await delay(500);
    // update info for all bitcoin nodes
    const network = getStoreState().network.networkById(node.networkId);
    await Promise.all(
      network.nodes.bitcoin.filter(n => n.status === Status.Started).map(actions.getInfo),
    );
  }),
  mineFirstBlock: thunk(async (actions, node, { injections, getState }) => {
    // if this is the first time starting the network, then automatically mine the first
    // block. Otherwise, Eclair nodes will fail to start.
    if (node.name === 'backend1') {
      // only mine this block on the first node
      const { chainInfo } = getState().nodes['backend1'];
      if (chainInfo) {
        await injections.bitcoindService.mine(1, node);
        await actions.getInfo(node);
      }
    }
  }),
};

export default bitcoindModel;
