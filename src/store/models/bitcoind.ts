import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode, StoreInjections } from 'types';

export interface BitcoindModel {
  chainInfo: ChainInfo | undefined;
  walletInfo: WalletInfo | undefined;
  setChainInfo: Action<BitcoindModel, ChainInfo>;
  setWalletinfo: Action<BitcoindModel, WalletInfo>;
  getInfo: Thunk<BitcoindModel, BitcoinNode, StoreInjections>;
  mine: Thunk<BitcoindModel, { blocks: number; node: BitcoinNode }, StoreInjections>;
}

const bitcoindModel: BitcoindModel = {
  chainInfo: undefined,
  walletInfo: undefined,
  setChainInfo: action((state, chainInfo) => {
    state.chainInfo = chainInfo;
  }),
  setWalletinfo: action((state, walletInfo) => {
    state.walletInfo = walletInfo;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    actions.setChainInfo(await injections.bitcoindService.getBlockchainInfo());
    actions.setWalletinfo(await injections.bitcoindService.getWalletInfo());
  }),
  mine: thunk(async (actions, { blocks, node }, { injections }) => {
    await injections.bitcoindService.mine(blocks);
    await actions.getInfo(node);
  }),
};

export default bitcoindModel;
