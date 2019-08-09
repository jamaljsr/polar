import { AnyAction } from 'redux';
import { connectRouter, RouterState } from 'connected-react-router';
import { History } from 'history';
import { reducer, Reducer } from 'easy-peasy';
import counterModel, { CounterModel } from './counter';

export interface RootModel {
  router: Reducer<RouterState, AnyAction>;
  counter: CounterModel;
}

export const createModel = (history: History<any>): RootModel => {
  const rootModel: RootModel = {
    router: reducer(connectRouter(history) as any),
    counter: counterModel,
  };
  return rootModel;
};
