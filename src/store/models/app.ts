import { shell } from 'electron';
import { message, notification } from 'antd';
import { ArgsProps } from 'antd/lib/notification';
import { push } from 'connected-react-router';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { ipcChannels } from 'shared';
import { DockerVersions, StoreInjections } from 'types';
import { delay } from 'utils/async';
import { RootModel } from './';

export interface NotifyOptions {
  message: string;
  description?: string;
  error?: Error;
}

export interface AppModel {
  initialized: boolean;
  dockerVersions: DockerVersions;
  dockerImages: string[];
  setInitialized: Action<AppModel, boolean>;
  initialize: Thunk<AppModel, any, StoreInjections, RootModel>;
  setDockerVersions: Action<AppModel, DockerVersions>;
  getDockerVersions: Thunk<AppModel, { throwErr?: boolean }, StoreInjections, RootModel>;
  setDockerImages: Action<AppModel, string[]>;
  getDockerImages: Thunk<AppModel, any, StoreInjections, RootModel>;
  notify: Action<AppModel, NotifyOptions>;
  delayedMessage: Thunk<
    AppModel,
    { msg: string; delaySecs: number; callback: () => Promise<string> },
    StoreInjections,
    RootModel
  >;
  navigateTo: Thunk<AppModel, string>;
  openInBrowser: Action<AppModel, string>;
  openWindow: Thunk<AppModel, string, StoreInjections, RootModel>;
  clearAppCache: Thunk<AppModel, void, StoreInjections, RootModel>;
}

const appModel: AppModel = {
  // state properties
  initialized: false,
  dockerVersions: { docker: '', compose: '' },
  dockerImages: [],
  // reducer actions (mutations allowed thx to immer)
  setInitialized: action((state, initialized) => {
    state.initialized = initialized;
  }),
  initialize: thunk(async (actions, payload, { getStoreActions }) => {
    await getStoreActions().network.load();
    await actions.getDockerVersions({});
    await actions.getDockerImages();
    actions.setInitialized(true);
  }),
  setDockerVersions: action((state, versions) => {
    state.dockerVersions = versions;
  }),
  getDockerVersions: thunk(async (actions, { throwErr }, { injections }) => {
    const versions = await injections.dockerService.getVersions(throwErr);
    actions.setDockerVersions(versions);
  }),
  setDockerImages: action((state, images) => {
    state.dockerImages = images;
  }),
  getDockerImages: thunk(async (actions, payload, { injections }) => {
    const images = await injections.dockerService.getImages();
    actions.setDockerImages(images);
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
  /**
   * The purpose of this function is to display a countdown notification in
   * the UI that will execute a supplied callback when the countdown expires.
   */
  delayedMessage: thunk(async (actions, { msg, delaySecs, callback }) => {
    // get a unique key to support multiple messages
    const key = new Date().getTime();
    // set the initial duration to the delay supplied
    let duration = delaySecs;
    // display the message in the ui
    message.loading({ key, content: `${msg} (${duration}s)`, duration });
    // update the content of the message every second
    const interval = setInterval(() => {
      duration -= 1;
      if (duration > 0) {
        message.loading({ key, content: `${msg} (${duration}s)`, duration });
      }
    }, 1000);
    // halt execution of the rest of this function until the delay is reached
    await delay(duration * 1000);
    // clear the interval
    clearInterval(interval);
    // execute the callback function to receive a success message
    const result = await callback();
    // display a success message in the ui
    message.success(result, 3);
  }),
  navigateTo: thunk((actions, route, { dispatch }) => {
    dispatch(push(route));
  }),
  openInBrowser: action((state, url) => {
    shell.openExternal(url);
  }),
  openWindow: thunk(async (actions, url, { injections }) => {
    await injections.ipc(ipcChannels.openWindow, { url });
  }),
  clearAppCache: thunk(async (actions, payload, { injections }) => {
    await injections.ipc(ipcChannels.clearCache);
  }),
};

export default appModel;
