import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { CommonNode, LndNode, Network, Status, StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { createLndNetworkNode, createNetwork } from 'utils/network';
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
  addLndNode: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<LndNode>>;
  setStatus: Action<
    NetworkModel,
    { id: number; status: Status; only?: string; all?: boolean }
  >;
  start: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
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
  load: thunk(async (actions, payload, { injections, getStoreActions }) => {
    const { networks, charts } = await injections.dockerService.loadNetworks();
    if (networks && networks.length) {
      actions.setNetworks(networks);
    }
    getStoreActions().designer.setAllCharts(charts);
    actions.setLoaded(true);
  }),
  save: thunk(async (actions, payload, { getState, injections, getStoreState }) => {
    const data = {
      networks: getState().networks,
      charts: getStoreState().designer.allCharts,
    };
    await injections.dockerService.saveNetworks(data);
  }),
  add: action((state, { name, lndNodes, bitcoindNodes }) => {
    const nextId = Math.max(0, ...state.networks.map(n => n.id)) + 1;
    const network = createNetwork({ id: nextId, name, lndNodes, bitcoindNodes });
    state.networks.push(network);
    info(`Added new network '${network.name}' to redux state`);
  }),
  addNetwork: thunk(
    async (actions, payload, { dispatch, getState, injections, getStoreActions }) => {
      actions.add(payload);
      const { networks } = getState();
      const newNetwork = networks[networks.length - 1];
      await injections.dockerService.saveComposeFile(newNetwork);
      const chart = initChartFromNetwork(newNetwork);
      getStoreActions().designer.addChart({ id: newNetwork.id, chart });
      await actions.save();
      dispatch(push(NETWORK_VIEW(newNetwork.id)));
    },
  ),
  addLndNode: thunk(async (actions, id, { getState, injections }) => {
    const networks = getState().networks;
    const network = networks.find(n => n.id === id);
    if (!network) throw new Error(`Network with the id '${id}' was not found.`);
    const node = createLndNetworkNode(network, Status.Stopped);
    network.nodes.lightning.push(node);
    actions.setNetworks(networks);
    await actions.save();
    await injections.dockerService.saveComposeFile(network);
    return node;
  }),
  setStatus: action((state, { id, status, only, all = true }) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) throw new Error(`Network with the id '${id}' was not found.`);
    const setNodeStatus = (n: CommonNode) => (n.status = status);
    if (only) {
      // only update a specific node's status
      network.nodes.lightning.filter(n => n.name === only).forEach(setNodeStatus);
      network.nodes.bitcoin.filter(n => n.name === only).forEach(setNodeStatus);
    } else if (all) {
      // update all node statuses
      network.status = status;
      network.nodes.bitcoin.forEach(setNodeStatus);
      network.nodes.lightning.forEach(setNodeStatus);
    } else {
      // if no specific node name provided, just update the network status
      network.status = status;
    }
  }),
  start: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    actions.setStatus({ id: network.id, status: Status.Starting });
    try {
      // start the docker containers
      await injections.dockerService.start(network);
      // set the status of only the network to Started
      actions.setStatus({ id: network.id, status: Status.Started, all: false });
      // wait for lnd nodes to come online before updating their status
      for (const lnd of network.nodes.lightning) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.lndService.waitUntilOnline(lnd).then(isOnline => {
          actions.setStatus({
            id: network.id,
            status: isOnline ? Status.Started : Status.Error,
            only: lnd.name,
          });
        });
      }
      // wait for bitcoind nodes to come online before updating their status
      for (const bitcoind of network.nodes.bitcoin) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.bitcoindService.waitUntilOnline(bitcoind.ports.rpc).then(isOnline => {
          actions.setStatus({
            id: network.id,
            status: isOnline ? Status.Started : Status.Error,
            only: bitcoind.name,
          });
        });
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
};

export default networkModel;
