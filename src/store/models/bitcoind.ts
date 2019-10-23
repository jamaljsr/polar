import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode } from 'shared/types';
import { StoreInjections } from 'types';
import { prefixTranslation } from 'utils/translate';

const { l } = prefixTranslation('store.models.bitcoind');

export interface BitcoindModel {
  chainInfo: ChainInfo | undefined;
  walletInfo: WalletInfo | undefined;
  setChainInfo: Action<BitcoindModel, ChainInfo>;
  setWalletinfo: Action<BitcoindModel, WalletInfo>;
  getInfo: Thunk<BitcoindModel, BitcoinNode, StoreInjections>;
  mine: Thunk<BitcoindModel, { blocks: number; node: BitcoinNode }, StoreInjections>;
}

const bitcoindModel: BitcoindModel = {
  // computed properties/functions
  chainInfo: undefined,
  walletInfo: undefined,
  // reducer actions (mutations allowed thx to immer)
  setChainInfo: action((state, chainInfo) => {
    state.chainInfo = chainInfo;
  }),
  setWalletinfo: action((state, walletInfo) => {
    state.walletInfo = walletInfo;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    actions.setChainInfo(
      await injections.bitcoindService.getBlockchainInfo(node.ports.rpc),
    );
    actions.setWalletinfo(await injections.bitcoindService.getWalletInfo(node.ports.rpc));
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
