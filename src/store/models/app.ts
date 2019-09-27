import { push } from 'connected-react-router';
import { Thunk, thunk } from 'easy-peasy';

export interface AppModel {
  navigateTo: Thunk<AppModel, string>;
}

const appModel: AppModel = {
  navigateTo: thunk((actions, route, { dispatch }) => {
    dispatch(push(route));
  }),
};

export default appModel;
