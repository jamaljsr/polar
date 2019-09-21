import { ChainInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode, StoreInjections } from 'types';

export interface BitcoindModel {
  chainInfo: ChainInfo;
  setChainInfo: Action<BitcoindModel, ChainInfo>;
  getInfo: Thunk<BitcoindModel, BitcoinNode, StoreInjections>;
}

const bitcoindModel: BitcoindModel = {
  chainInfo: {} as ChainInfo,
  setChainInfo: action((state, chainInfo) => {
    state.chainInfo = chainInfo;
  }),
  getInfo: thunk(async (actions, node, { injections }) => {
    const info = await injections.bitcoindService.getBlockchainInfo();
    actions.setChainInfo(info);
  }),
};

export default bitcoindModel;
