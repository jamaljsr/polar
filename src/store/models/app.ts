import { getI18n } from 'react-i18next';
import { shell } from 'electron';
import { notification } from 'antd';
import { ArgsProps } from 'antd/lib/notification';
import { push } from 'connected-react-router';
import { Action, action, Thunk, thunk } from 'easy-peasy';
import { ipcChannels } from 'shared';
import {
  AppSettings,
  DockerRepoState,
  DockerRepoUpdates,
  DockerVersions,
  StoreInjections,
} from 'types';
import { defaultRepoState } from 'utils/constants';
import { RootModel } from './';

export interface NotifyOptions {
  message: string;
  description?: string;
  error?: Error;
}

export interface AppModel {
  initialized: boolean;
  settings: AppSettings;
  dockerVersions: DockerVersions;
  // images that have been pulled/downloaded from Docker Hub
  dockerImages: string[];
  // all images that are available on Docker Hub
  dockerRepoState: DockerRepoState;
  setInitialized: Action<AppModel, boolean>;
  setSettings: Action<AppModel, Partial<AppSettings>>;
  loadSettings: Thunk<AppModel, any, StoreInjections, RootModel>;
  updateSettings: Thunk<AppModel, Partial<AppSettings>, StoreInjections, RootModel>;
  initialize: Thunk<AppModel, any, StoreInjections, RootModel>;
  setDockerVersions: Action<AppModel, DockerVersions>;
  getDockerVersions: Thunk<AppModel, { throwErr?: boolean }, StoreInjections, RootModel>;
  setDockerImages: Action<AppModel, string[]>;
  getDockerImages: Thunk<AppModel, any, StoreInjections, RootModel>;
  setRepoState: Action<AppModel, DockerRepoState>;
  loadRepoState: Thunk<AppModel, any, StoreInjections, RootModel>;
  saveRepoState: Thunk<AppModel, DockerRepoState, StoreInjections, RootModel>;
  checkForRepoUpdates: Thunk<
    AppModel,
    any,
    StoreInjections,
    RootModel,
    Promise<DockerRepoUpdates>
  >;
  notify: Action<AppModel, NotifyOptions>;
  navigateTo: Thunk<AppModel, string>;
  openInBrowser: Action<AppModel, string>;
  openWindow: Thunk<AppModel, string, StoreInjections, RootModel>;
  clearAppCache: Thunk<AppModel, void, StoreInjections, RootModel>;
}

const appModel: AppModel = {
  // state properties
  initialized: false,
  settings: {
    lang: getI18n().language,
    theme: 'dark',
    showAllNodeVersions: false,
  },
  dockerVersions: { docker: '', compose: '' },
  dockerImages: [],
  dockerRepoState: defaultRepoState,
  // reducer actions (mutations allowed thx to immer)
  setInitialized: action((state, initialized) => {
    state.initialized = initialized;
  }),
  initialize: thunk(async (actions, _, { getStoreActions }) => {
    await actions.loadSettings();
    await actions.loadRepoState();
    await getStoreActions().network.load();
    await actions.getDockerVersions({});
    await actions.getDockerImages();
    actions.setInitialized(true);
  }),
  setSettings: action((state, settings) => {
    state.settings = {
      ...state.settings,
      ...settings,
    };
  }),
  loadSettings: thunk(async (actions, _, { injections }) => {
    const settings = await injections.settingsService.load();
    if (settings) {
      actions.setSettings(settings);
      await getI18n().changeLanguage(settings.lang);
    }
  }),
  updateSettings: thunk(async (actions, updates, { injections, getState }) => {
    actions.setSettings(updates);
    const { settings } = getState();
    await injections.settingsService.save(settings);
    if (updates.lang) await getI18n().changeLanguage(settings.lang);
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
  setRepoState: action((state, repoState) => {
    state.dockerRepoState = repoState;
  }),
  loadRepoState: thunk(async (actions, _, { injections, getState }) => {
    const defaultState = getState().dockerRepoState;
    const fileState = await injections.repoService.load();
    // only use the file version if it is greater than the default hard-coded version
    if (fileState && fileState.version > defaultState.version) {
      actions.setRepoState(fileState);
    }
  }),
  saveRepoState: thunk(async (actions, repoState, { injections }) => {
    await injections.repoService.save(repoState);
    actions.setRepoState(repoState);
  }),
  checkForRepoUpdates: thunk(async (actions, payload, { injections, getState }) => {
    const { dockerRepoState } = getState();
    return injections.repoService.checkForUpdates(dockerRepoState);
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
        description,
      });
    } else {
      notification.error({
        ...options,
        duration: 10,
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
  openWindow: thunk(async (actions, url, { injections }) => {
    await injections.ipc(ipcChannels.openWindow, { url });
  }),
  clearAppCache: thunk(async (actions, payload, { injections }) => {
    await injections.ipc(ipcChannels.clearCache);
  }),
};

export default appModel;
