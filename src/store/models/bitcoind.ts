import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode } from 'shared/types';
import { StoreInjections } from 'types';
import { prefixTranslation } from 'utils/translate';

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
  setChainInfo: Action<BitcoindModel, { node: BitcoinNode; chainInfo: ChainInfo }>;
  setWalletinfo: Action<BitcoindModel, { node: BitcoinNode; walletInfo: WalletInfo }>;
  getInfo: Thunk<BitcoindModel, BitcoinNode, StoreInjections>;
  mine: Thunk<BitcoindModel, { blocks: number; node: BitcoinNode }, StoreInjections>;
}

const bitcoindModel: BitcoindModel = {
  // computed properties/functions
  nodes: {},
  // reducer actions (mutations allowed thx to immer)
  removeNode: action((state, name) => {
    if (state.nodes[name]) {
      delete state.nodes[name];
    }
  }),
  setChainInfo: action((state, { node, chainInfo }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].chainInfo = chainInfo;
  }),
  setWalletinfo: action((state, { node, walletInfo }) => {
    if (!state.nodes[node.name]) state.nodes[node.name] = {};
    state.nodes[node.name].walletInfo = walletInfo;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const chainInfo = await injections.bitcoindService.getBlockchainInfo(node.ports.rpc);
    actions.setChainInfo({ node, chainInfo });
    const walletInfo = await injections.bitcoindService.getWalletInfo(node.ports.rpc);
    actions.setWalletinfo({ node, walletInfo });
  }),
  mine: thunk(async (actions, { blocks, node }, { injections }) => {
    if (blocks < 0) {
      throw new Error(l('mineError'));
    }
    await injections.bitcoindService.mine(blocks, node.ports.rpc);
    await actions.getInfo(node);
  }),
};

export default bitcoindModel;
