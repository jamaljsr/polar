import { ChainInfo, WalletInfo } from 'bitcoin-core';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode, LNDNode, Status, StoreInjections } from 'types';

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
    actions.setChainInfo(
      await injections.bitcoindService.getBlockchainInfo(node.ports.rpc),
    );
    actions.setWalletinfo(await injections.bitcoindService.getWalletInfo(node.ports.rpc));

    const lnd: LNDNode = {
      id: 1,
      name: 'polar-n1-lnd-1',
      type: 'lightning',
      implementation: 'LND',
      version: '0.7.1-beta',
      status: Status.Stopped,
      backendName: 'bitcoind1',
      ports: {
        rest: 8081,
        grpc: 10001,
      },
    };
    await injections.lndService.connect(lnd);
    await injections.lndService.getInfo(lnd);
  }),
  mine: thunk(async (actions, { blocks, node }, { injections }) => {
    if (blocks < 0) {
      throw new Error('The number of blocks to mine must be a positve number');
    }
    await injections.bitcoindService.mine(blocks, node.ports.rpc);
    await actions.getInfo(node);
  }),
};

export default bitcoindModel;
