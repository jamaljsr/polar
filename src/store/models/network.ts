import { info } from 'electron-log';
import { IChart } from '@mrblenny/react-flow-chart';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { CommonNode, Network, Status, StoreInjections } from 'types';
import { createNetwork } from 'utils/network';
import { NETWORK_VIEW } from 'components/routing';
import { RootModel } from './';

interface AddNetworkArgs {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

export interface NetworkModel {
  networks: Network[];
  loaded: boolean;
  networkById: Computed<NetworkModel, (id?: string | number) => Network>;
  allStatuses: Computed<NetworkModel, (id?: number) => Status[]>;
  setNetworks: Action<NetworkModel, Network[]>;
  setLoaded: Action<NetworkModel, boolean>;
  load: Thunk<NetworkModel, any, StoreInjections, RootModel, Promise<void>>;
  save: Thunk<NetworkModel, any, StoreInjections, RootModel, Promise<void>>;
  add: Action<NetworkModel, AddNetworkArgs>;
  addNetwork: Thunk<
    NetworkModel,
    AddNetworkArgs,
    StoreInjections,
    RootModel,
    Promise<void>
  >;
  setStatus: Action<
    NetworkModel,
    { id: number; status: Status; only?: string; all?: boolean }
  >;
  start: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
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
  allStatuses: computed(state => (id?: string | number) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) {
      throw new Error(`Network with the id '${id}' was not found.`);
    }
    return [network.status].concat(
      network.nodes.bitcoin.map(n => n.status),
      network.nodes.lightning.map(n => n.status),
    );
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
  setStatus: action((state, { id, status, only, all = true }) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) throw new Error(`Network with the id '${id}' was not found.`);
    if (all) {
      // update all node statuses
      network.status = status;
      network.nodes.bitcoin.forEach(n => (n.status = status));
      network.nodes.lightning.forEach(n => (n.status = status));
    } else if (only) {
      // if
      const setNodeStatus = (n: CommonNode) => {
        if (n.name === only) n.status = status;
      };
      network.nodes.lightning.forEach(setNodeStatus);
      network.nodes.bitcoin.forEach(setNodeStatus);
    } else {
      // if no specific node name provided, just update the network status
      network.status = status;
      network.nodes.bitcoin.forEach(n => (n.status = status));
    }
  }),
  start: thunk(async (actions, networkId, { getState, injections, getStoreActions }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    actions.setStatus({ id: network.id, status: Status.Starting });
    try {
      await injections.dockerService.start(network);
      actions.setStatus({ id: network.id, status: Status.Started, all: false });
      for (const lnd of network.nodes.lightning) {
        await getStoreActions().lnd.initialize(lnd);
        // don't set the status of each LND node until it can respond to getInfo
        injections.lndService.waitUntilOnline(lnd).then(online =>
          actions.setStatus({
            id: network.id,
            status: online ? Status.Started : Status.Error,
            only: lnd.name,
          }),
        );
      }
    } catch (e) {
      actions.setStatus({ id: network.id, status: Status.Error });
      info(`unable to start network '${network.name}'`, e.message);
      throw e;
    }
  }),
  stop: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    actions.setStatus({ id: network.id, status: Status.Stopping });
    try {
      await injections.dockerService.stop(network);
      actions.setStatus({ id: network.id, status: Status.Stopped });
    } catch (e) {
      actions.setStatus({ id: network.id, status: Status.Error });
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
