import { shell } from 'electron';
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
  setInitialized: Action<AppModel, boolean>;
  initialize: Thunk<AppModel, any, StoreInjections, RootModel>;
  setDockerVersions: Action<AppModel, DockerVersions>;
  getDockerVersions: Thunk<AppModel, { throwErr?: boolean }, StoreInjections, RootModel>;
  notify: Action<AppModel, NotifyOptions>;
  navigateTo: Thunk<AppModel, string>;
  openInBrowser: Action<AppModel, string>;
}

const appModel: AppModel = {
  // state properties
  initialized: false,
  dockerVersions: {
    docker: '',
    compose: '',
  },
  // reducer actions (mutations allowed thx to immer)
  setInitialized: action((state, initialized) => {
    state.initialized = initialized;
  }),
  initialize: thunk(async (actions, payload, { getStoreActions }) => {
    await getStoreActions().network.load();
    await actions.getDockerVersions({});
    actions.setInitialized(true);
  }),
  setDockerVersions: action((state, versions) => {
    state.dockerVersions = versions;
  }),
  getDockerVersions: thunk(async (actions, { throwErr }, { injections }) => {
    const versions = await injections.dockerService.getVersions(throwErr);
    actions.setDockerVersions(versions);
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
  openInBrowser: action((state, url) => {
    shell.openExternal(url);
  }),
};

export default appModel;
