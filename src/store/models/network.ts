import { info } from 'electron-log';
import { IChart } from '@mrblenny/react-flow-chart';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { Network, Status, StoreInjections } from 'types';
import { createNetwork } from 'utils/network';
import { NETWORK_VIEW } from 'components/routing';

interface AddNetworkArgs {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

export interface NetworkModel {
  networks: Network[];
  loaded: boolean;
  networkById: Computed<NetworkModel, (id?: string | number) => Network>;
  setNetworks: Action<NetworkModel, Network[]>;
  setLoaded: Action<NetworkModel, boolean>;
  load: Thunk<NetworkModel, any, StoreInjections, {}, Promise<void>>;
  save: Thunk<NetworkModel, any, StoreInjections, {}, Promise<void>>;
  add: Action<NetworkModel, AddNetworkArgs>;
  addNetwork: Thunk<NetworkModel, AddNetworkArgs, StoreInjections, {}, Promise<void>>;
  setNetworkStatus: Action<NetworkModel, { id: number; status: Status }>;
  start: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  setNetworkDesign: Action<NetworkModel, { id: number; chart: IChart }>;
}
const networkModel: NetworkModel = {
  // state properties
  networks: [],
  loaded: false,
  // computed properties/functions
  networkById: computed(state => (id?: string | number) => {
    const networkId = typeof id === 'number' ? id : parseInt(id || '');
    const network = state.networks.find(n => n.id === networkId);
    if (!network) {
      throw new Error(`Network with the id '${networkId}' was not found.`);
    }
    return network;
  }),
  // reducer actions (mutations allowed thx to immer)
  setNetworks: action((state, networks) => {
    state.networks = networks;
  }),
  setLoaded: action((state, loaded) => {
    state.loaded = loaded;
  }),
  load: thunk(async (actions, payload, { injections }) => {
    const networks = await injections.dockerService.load();
    if (networks && networks.length) {
      actions.setNetworks(networks);
    }
    actions.setLoaded(true);
  }),
  save: thunk(async (actions, payload, { getState, injections }) => {
    await injections.dockerService.save(getState().networks);
  }),
  add: action((state, { name, lndNodes, bitcoindNodes }) => {
    const nextId = Math.max(0, ...state.networks.map(n => n.id)) + 1;
    const network = createNetwork({ id: nextId, name, lndNodes, bitcoindNodes });
    state.networks.push(network);
    info(`Added new network '${network.name}' to redux state`);
  }),
  addNetwork: thunk(async (actions, payload, { dispatch, getState, injections }) => {
    actions.add(payload);
    const { networks } = getState();
    const newNetwork = networks[networks.length - 1];
    await injections.dockerService.create(newNetwork);
    await injections.dockerService.save(networks);
    dispatch(push(NETWORK_VIEW(newNetwork.id)));
  }),
  setNetworkStatus: action((state, { id, status }) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) throw new Error(`Network with the id '${id}' was not found.`);
    network.status = status;
    network.nodes.bitcoin.forEach(n => (n.status = status));
    network.nodes.lightning.forEach(n => (n.status = status));
  }),
  start: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    actions.setNetworkStatus({ id: network.id, status: Status.Starting });
    try {
      await injections.dockerService.start(network);
      actions.setNetworkStatus({ id: network.id, status: Status.Started });
      for (const lnd of network.nodes.lightning) {
        await injections.lndService.connect(lnd);
      }
    } catch (e) {
      actions.setNetworkStatus({ id: network.id, status: Status.Error });
      info(`unable to start network '${network.name}'`, e.message);
      throw e;
    }
  }),
  stop: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    actions.setNetworkStatus({ id: network.id, status: Status.Stopping });
    try {
      await injections.dockerService.stop(network);
      actions.setNetworkStatus({ id: network.id, status: Status.Stopped });
    } catch (e) {
      actions.setNetworkStatus({ id: network.id, status: Status.Error });
      info(`unable to stop network '${network.name}'`, e.message);
      throw e;
    }
  }),
  toggle: thunk(async (actions, networkId, { getState }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    if (network.status === Status.Stopped || network.status === Status.Error) {
      await actions.start(network.id);
    } else if (network.status === Status.Started) {
      await actions.stop(network.id);
    }
  }),
  setNetworkDesign: action((state, { id, chart }) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) throw new Error(`Network with the id '${id}' was not found.`);
    network.design = { ...chart };
  }),
};

export default networkModel;
