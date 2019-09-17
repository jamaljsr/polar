import { push } from 'connected-react-router';
import { Action, action, Thunk, thunk } from 'easy-peasy';

export interface AppModel {
  sidebarCollapsed: boolean;
  collapseSidebar: Action<AppModel, boolean>;
  navigateTo: Thunk<AppModel, string>;
}

const appModel: AppModel = {
  sidebarCollapsed: false,
  collapseSidebar: action((state, collapse) => {
    state.sidebarCollapsed = collapse;
  }),
  navigateTo: thunk((actions, route, { dispatch }) => {
    dispatch(push(route));
  }),
};

export default appModel;
