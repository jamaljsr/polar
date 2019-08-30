import { connectRouter, RouterState } from 'connected-react-router';
import { reducer, Reducer } from 'easy-peasy';
import { History } from 'history';
import { AnyAction } from 'redux';
import networkModel, { NetworkModel } from './network';

export interface RootModel {
  router: Reducer<RouterState, AnyAction>;
  network: NetworkModel;
}

export const createModel = (history: History<any>): RootModel => {
  const rootModel: RootModel = {
    router: reducer(connectRouter(history) as any),
    network: networkModel,
  };
  return rootModel;
};
