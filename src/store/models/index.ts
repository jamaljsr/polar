import { connectRouter, RouterState } from 'connected-react-router';
import { reducer, Reducer } from 'easy-peasy';
import { History } from 'history';
import { AnyAction } from 'redux';
import appModel, { AppModel } from './app';
import designerModel, { DesignerModel } from './designer';
import networkModel, { NetworkModel } from './network';

export interface RootModel {
  router: Reducer<RouterState, AnyAction>;
  app: AppModel;
  network: NetworkModel;
  designer: DesignerModel;
}

export const createModel = (history: History<any>): RootModel => {
  const rootModel: RootModel = {
    router: reducer(connectRouter(history) as any),
    app: appModel,
    network: networkModel,
    designer: designerModel,
  };
  return rootModel;
};
