import { Action, action } from 'easy-peasy';

export interface AppModel {
  sidebarCollapsed: boolean;
  collapseSidebar: Action<AppModel, boolean>;
}

const appModel: AppModel = {
  sidebarCollapsed: false,
  collapseSidebar: action((state, collapse) => {
    state.sidebarCollapsed = collapse;
  }),
};

export default appModel;
