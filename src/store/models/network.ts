import { info } from 'electron-log';
import { join } from 'path';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import {
  BitcoindVersion,
  BitcoinNode,
  CLightningVersion,
  CommonNode,
  LightningNode,
  LndVersion,
  Status,
} from 'shared/types';
import { Network, StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { rm } from 'utils/files';
import {
  createBitcoindNetworkNode,
  createCLightningNetworkNode,
  createLndNetworkNode,
  createNetwork,
  getOpenPorts,
  OpenPorts,
} from 'utils/network';
import { prefixTranslation } from 'utils/translate';
import { NETWORK_VIEW } from 'components/routing';
import { RootModel } from './';

const { l } = prefixTranslation('store.models.network');

interface AddNetworkArgs {
  name: string;
  lndNodes: number;
  clightningNodes: number;
  bitcoindNodes: number;
}

export interface NetworkModel {
  networks: Network[];
  networkById: Computed<NetworkModel, (id?: string | number) => Network>;
  setNetworks: Action<NetworkModel, Network[]>;
  updateNodePorts: Action<NetworkModel, { id: number; ports: OpenPorts }>;
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
  addNode: Thunk<
    NetworkModel,
    {
      id: number;
      type: string;
      version: LndVersion | CLightningVersion | BitcoindVersion;
    },
    StoreInjections,
    RootModel,
    Promise<LightningNode | BitcoinNode>
  >;
  removeNode: Thunk<NetworkModel, { node: LightningNode }, StoreInjections, RootModel>;
  removeBitcoinNode: Thunk<
    NetworkModel,
    { node: BitcoinNode },
    StoreInjections,
    RootModel
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
  updateNodePorts: action((state, { id, ports }) => {
    const network = state.networks.find(n => n.id === id) as Network;
    network.nodes.bitcoin
      .filter(n => !!ports[n.name])
      .forEach(n => (n.ports = { ...n.ports, ...ports[n.name] }));
    network.nodes.lightning
      .filter(n => !!ports[n.name])
      .forEach(n => (n.ports = { ...n.ports, ...ports[n.name] }));
  }),
  load: thunk(async (actions, payload, { injections, getStoreActions }) => {
    const { networks, charts } = await injections.dockerService.loadNetworks();
    if (networks && networks.length) {
      actions.setNetworks(networks);
    }
    getStoreActions().designer.setAllCharts(charts);
  }),
  save: thunk(async (actions, payload, { getState, injections, getStoreState }) => {
    const data = {
      networks: getState().networks,
      charts: getStoreState().designer.allCharts,
    };
    await injections.dockerService.saveNetworks(data);
  }),
  add: action((state, { name, lndNodes, clightningNodes, bitcoindNodes }) => {
    const nextId = Math.max(0, ...state.networks.map(n => n.id)) + 1;
    const network = createNetwork({
      id: nextId,
      name,
      lndNodes,
      clightningNodes,
      bitcoindNodes,
    });
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
  addNode: thunk(async (actions, { id, type, version }, { getState, injections }) => {
    const networks = getState().networks;
    const network = networks.find(n => n.id === id);
    if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
    let node: LightningNode | BitcoinNode;
    switch (type) {
      case 'lnd':
        node = createLndNetworkNode(network, version as LndVersion);
        network.nodes.lightning.push(node);
        break;
      case 'c-lightning':
        node = createCLightningNetworkNode(network, version as CLightningVersion);
        network.nodes.lightning.push(node);
        break;
      case 'bitcoind':
        node = createBitcoindNetworkNode(network, version as BitcoindVersion);
        network.nodes.bitcoin.push(node);
        break;
      default:
        throw new Error(`Cannot add uknown node type '${type}' to the network`);
    }
    actions.setNetworks([...networks]);
    await actions.save();
    await injections.dockerService.saveComposeFile(network);
    return node;
  }),
  removeNode: thunk(
    async (actions, { node }, { getState, injections, getStoreActions }) => {
      const networks = getState().networks;
      const network = networks.find(n => n.id === node.networkId);
      if (!network) throw new Error(l('networkByIdErr', { networkId: node.networkId }));
      // remove the node from the network
      network.nodes.lightning = network.nodes.lightning.filter(n => n !== node);
      // remove the node's data from the lightning redux state
      getStoreActions().lightning.removeNode(node.name);
      // remove the node rom the running docker network
      if (network.status === Status.Started) {
        await injections.dockerService.removeNode(network, node);
      }
      // clear cached RPC data
      if (node.implementation === 'LND') getStoreActions().app.clearAppCache();
      // remove the node from the chart's redux state
      getStoreActions().designer.removeNode(node.name);
      // update the network in the redux state and save to disk
      actions.setNetworks([...networks]);
      await actions.save();
      // delete the docker volume data from disk
      const volumeDir = node.implementation.toLocaleLowerCase().replace('-', '');
      rm(join(network.path, 'volumes', volumeDir, node.name));
      // sync the chart
      if (network.status === Status.Started) {
        await getStoreActions().designer.syncChart(network);
      }
    },
  ),
  removeBitcoinNode: thunk(
    async (actions, { node }, { getState, injections, getStoreActions }) => {
      const networks = getState().networks;
      const network = networks.find(n => n.id === node.networkId);
      if (!network) throw new Error(l('networkByIdErr', { networkId: node.networkId }));
      const { dockerService, lightningFactory } = injections;
      const { bitcoind, designer } = getStoreActions();
      const { bitcoin, lightning } = network.nodes;

      if (bitcoin.length === 1) throw new Error('Cannot remove the only bitcoin node');
      const index = bitcoin.indexOf(node);
      // update LN nodes to use a different backend
      lightning
        .filter(n => n.backendName === node.name)
        .forEach(n => (n.backendName = bitcoin[0].name));

      // bitcoin nodes are peer'd with the nodes immediately before and after. if the
      // node being removed is in between two nodes, then connect those two nodes
      // together. Otherwise, the network will be operating on two different chains
      if (index > 0 && index < bitcoin.length - 1) {
        // make prev & next nodes peers
        const [prev, curr, next] = bitcoin.slice(index - 1, index + 2);
        // remove curr and add next to prev peers
        prev.peers = [...prev.peers.filter(p => p !== curr.name), next.name];
        // remove curr and add prev to next peers
        next.peers = [prev.name, ...next.peers.filter(p => p !== curr.name)];
      }
      // remove the node from the network
      network.nodes.bitcoin = bitcoin.filter(n => n !== node);
      // remove the node's data from the bitcoind redux state
      bitcoind.removeNode(node.name);
      if (network.status === Status.Started) {
        // restart the whole network if it is running
        await actions.stop(network.id);
        await dockerService.saveComposeFile(network);
        await actions.start(network.id);
      } else {
        // save compose file if the network is not running
        await dockerService.saveComposeFile(network);
      }
      // remove the node from the chart's redux state
      designer.removeNode(node.name);
      // update the network in the redux state and save to disk
      actions.setNetworks([...networks]);
      await actions.save();
      // delete the docker volume data from disk
      const volumeDir = node.implementation.toLocaleLowerCase().replace('-', '');
      rm(join(network.path, 'volumes', volumeDir, node.name));
      if (network.status === Status.Started) {
        // wait for the LN nodes to come back online then update the chart
        await Promise.all(
          lightning.map(n => lightningFactory.getService(n).waitUntilOnline(n)),
        );
        await designer.syncChart(network);
      }
    },
  ),
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
    let network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
    const { id } = network;
    actions.setStatus({ id: id, status: Status.Starting });
    try {
      // make sure the node ports are available
      const ports = await getOpenPorts(network);
      if (ports) {
        // at least one port was updated. save the network & composeFile
        actions.updateNodePorts({ id, ports });
        // refetch the network with the updated ports
        network = getState().networks.find(n => n.id === networkId) as Network;
        await actions.save();
        await injections.dockerService.saveComposeFile(network);
      }
      // start the docker containers
      await injections.dockerService.start(network);
      // update the list of docker images pulled since new images may be pulled
      await getStoreActions().app.getDockerImages();
      // set the status of only the network to Started
      actions.setStatus({ id, status: Status.Started, all: false });

      // wait for lnd nodes to come online before updating their status
      for (const node of network.nodes.lightning) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.lightningFactory
          .getService(node)
          .waitUntilOnline(node)
          .then(() => actions.setStatus({ id, status: Status.Started, only: node.name }))
          .catch(error =>
            actions.setStatus({ id, status: Status.Error, only: node.name, error }),
          );
      }
      // wait for bitcoind nodes to come online before updating their status
      for (const node of network.nodes.bitcoin) {
        // use .then() to continue execution while the promises are waiting to complete
        injections.bitcoindService
          .waitUntilOnline(node.ports.rpc)
          .then(() => {
            actions.setStatus({ id, status: Status.Started, only: node.name });
            return getStoreActions().bitcoind.getInfo(node);
          })
          .catch(error =>
            actions.setStatus({ id, status: Status.Error, only: node.name, error }),
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
    await actions.save();
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
  remove: thunk(async (actions, networkId, { getState, getStoreActions }) => {
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
    network.nodes.lightning.forEach(n => getStoreActions().lightning.removeNode(n.name));
    network.nodes.bitcoin.forEach(n => getStoreActions().bitcoind.removeNode(n.name));
    await actions.save();
    await getStoreActions().app.clearAppCache();
  }),
};

export default networkModel;
