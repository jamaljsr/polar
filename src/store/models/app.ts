import { notification } from 'antd';
import { ArgsProps } from 'antd/lib/notification';
import { push } from 'connected-react-router';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { DockerVersions, StoreInjections } from 'types';
import { RootModel } from './';

export interface NotifyOptions {
  message: string;
  description?: string;
  error?: Error;
}

export interface AppModel {
  initialized: boolean;
  dockerVersions: DockerVersions;
  setDockerVersions: Action<AppModel, DockerVersions>;
  setInitialized: Action<AppModel, boolean>;
  initialize: Thunk<AppModel, any, StoreInjections, RootModel>;
  notify: Action<AppModel, NotifyOptions>;
  navigateTo: Thunk<AppModel, string>;
}

const appModel: AppModel = {
  // state properties
  initialized: false,
  dockerVersions: {
    docker: '',
    compose: '',
  },
  // reducer actions (mutations allowed thx to immer)
  setDockerVersions: action((state, versions) => {
    state.dockerVersions = versions;
  }),
  setInitialized: action((state, initialized) => {
    state.initialized = initialized;
  }),
  initialize: thunk(async (actions, _, { injections, getStoreActions }) => {
    await getStoreActions().network.load();
    const versions = await injections.dockerService.getVersions();
    actions.setDockerVersions(versions);
    actions.setInitialized(true);
  }),
  notify: action((state, { message, description, error }) => {
    const options = {
      placement: 'bottomRight',
      bottom: 50,
    } as ArgsProps;
    if (!error) {
      notification.success({
        ...options,
        message: message,
      });
    } else {
      notification.error({
        ...options,
        message: message,
        description: description || error.message,
      });
    }
  }),
  navigateTo: thunk((actions, route, { dispatch }) => {
    dispatch(push(route));
  }),
};

export default appModel;
