import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { CommonNode, LndNode, LndVersion, Status } from 'shared/types';
import { Network, StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { rm } from 'utils/files';
import { createLndNetworkNode, createNetwork, ensureOpenPorts } from 'utils/network';
import { prefixTranslation } from 'utils/translate';
import { NETWORK_VIEW } from 'components/routing';
import { RootModel } from './';

const { l } = prefixTranslation('store.models.network');

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
  addLndNode: Thunk<
    NetworkModel,
    { id: number; version: LndVersion },
    StoreInjections,
    RootModel,
    Promise<LndNode>
  >;
  setStatus: Action<
    NetworkModel,
    { id: number; status: Status; only?: string; all?: boolean; error?: Error }
  >;
  start: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
  rename: Thunk<
    NetworkModel,
    { id: number; name: string },
    StoreInjections,
    RootModel,
    Promise<void>
  >;
  remove: Thunk<NetworkModel, number, StoreInjections, RootModel, Promise<void>>;
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
      throw new Error(l('networkByIdErr', { networkId }));
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
  addLndNode: thunk(async (actions, { id, version }, { getState, injections }) => {
    const networks = getState().networks;
    const network = networks.find(n => n.id === id);
    if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
    const node = createLndNetworkNode(network, version, Status.Stopped);
    network.nodes.lightning.push(node);
    actions.setNetworks(networks);
    await actions.save();
    await injections.dockerService.saveComposeFile(network);
    return node;
  }),
  setStatus: action((state, { id, status, only, all = true, error }) => {
    const network = state.networks.find(n => n.id === id);
    if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
    const setNodeStatus = (n: CommonNode) => {
      n.status = status;
      n.errorMsg = error && error.message;
    };
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
  start: thunk(async (actions, networkId, { getState, injections, getStoreActions }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
    const { id } = network;
    actions.setStatus({ id: id, status: Status.Starting });
    try {
      // make sure the node ports are available
      if (await ensureOpenPorts(network)) {
        // at least one port was updated. save the network & composeFile
        const networks = getState().networks.map(n => (n.id === id ? network : n));
        actions.setNetworks(networks);
        await actions.save();
        await injections.dockerService.saveComposeFile(network);
      }
      // start the docker containers
      await injections.dockerService.start(network);
      // set the status of only the network to Started
      actions.setStatus({ id, status: Status.Started, all: false });
      // wait for lnd nodes to come online before updating their status
      for (const lnd of network.nodes.lightning) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.lndService
          .waitUntilOnline(lnd)
          .then(() => actions.setStatus({ id, status: Status.Started, only: lnd.name }))
          .catch(error =>
            actions.setStatus({ id, status: Status.Error, only: lnd.name, error }),
          );
      }
      // wait for bitcoind nodes to come online before updating their status
      for (const bitcoind of network.nodes.bitcoin) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.bitcoindService
          .waitUntilOnline(bitcoind.ports.rpc)
          .then(() => {
            actions.setStatus({ id, status: Status.Started, only: bitcoind.name });
            return getStoreActions().bitcoind.getInfo(bitcoind);
          })
          .catch(error =>
            actions.setStatus({ id, status: Status.Error, only: bitcoind.name, error }),
          );
      }
    } catch (e) {
      actions.setStatus({ id, status: Status.Error });
      info(`unable to start network '${network.name}'`, e.message);
      throw e;
    }
  }),
  stop: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
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
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
    if (network.status === Status.Stopped || network.status === Status.Error) {
      await actions.start(network.id);
    } else if (network.status === Status.Started) {
      await actions.stop(network.id);
    }
  }),
  rename: thunk(async (actions, { id, name }, { getState }) => {
    if (!name) throw new Error(l('renameErr', { name }));
    const { networks } = getState();
    const network = networks.find(n => n.id === id);
    if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
    network.name = name;
    actions.setNetworks(networks);
    await actions.save();
  }),
  remove: thunk(async (actions, networkId, { getState, getStoreActions, injections }) => {
    const { networks } = getState();
    const network = networks.find(n => n.id === networkId);
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
    if (network.status !== Status.Stopped) {
      await actions.stop(networkId);
    }
    await rm(network.path);
    const newNetworks = networks.filter(n => n.id !== networkId);
    actions.setNetworks(newNetworks);
    getStoreActions().designer.removeChart(networkId);
    await actions.save();
    await injections.lndService.onNodesDeleted(network);
  }),
};

export default networkModel;
