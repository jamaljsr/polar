import { AnyAction } from 'redux';
import { connectRouter, RouterState } from 'connected-react-router';
import { History } from 'history';
import { reducer, Reducer } from 'easy-peasy';
import counterModel, { CounterModel } from './counter';
import networkModel, { NetworkModel } from './network';

export interface RootModel {
  router: Reducer<RouterState, AnyAction>;
  counter: CounterModel;
  network: NetworkModel;
}

export const createModel = (history: History<any>): RootModel => {
  const rootModel: RootModel = {
    router: reducer(connectRouter(history) as any),
    counter: counterModel,
    network: networkModel,
  };
  return rootModel;
};
