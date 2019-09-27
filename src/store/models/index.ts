import { connectRouter, RouterState } from 'connected-react-router';
import { reducer, Reducer } from 'easy-peasy';
import { History } from 'history';
import { AnyAction } from 'redux';
import appModel, { AppModel } from './app';
import bitcoindModel, { BitcoindModel } from './bitcoind';
import lndModel, { LndModel } from './lnd';
import networkModel, { NetworkModel } from './network';

export interface RootModel {
  router: Reducer<RouterState, AnyAction>;
  app: AppModel;
  network: NetworkModel;
  bitcoind: BitcoindModel;
  lnd: LndModel;
}

export const createModel = (history: History<any>): RootModel => {
  const rootModel: RootModel = {
    router: reducer(connectRouter(history) as any),
    app: appModel,
    network: networkModel,
    bitcoind: bitcoindModel,
    lnd: lndModel,
  };
  return rootModel;
};
