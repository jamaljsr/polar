import { info } from 'electron-log';
import { join } from 'path';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { BitcoinNode, CommonNode, LightningNode, Status } from 'shared/types';
import { Network, StoreInjections } from 'types';
import { initChartFromNetwork } from 'utils/chart';
import { APP_VERSION } from 'utils/constants';
import { rm } from 'utils/files';
import {
  createBitcoindNetworkNode,
  createCLightningNetworkNode,
  createLndNetworkNode,
  createNetwork,
  filterCompatibleBackends,
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
  add: Action<NetworkModel, Network>;
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
      version: string;
    },
    StoreInjections,
    RootModel,
    Promise<LightningNode | BitcoinNode>
  >;
  removeLightningNode: Thunk<
    NetworkModel,
    { node: LightningNode },
    StoreInjections,
    RootModel
  >;
  removeBitcoinNode: Thunk<
    NetworkModel,
    { node: BitcoinNode },
    StoreInjections,
    RootModel
  >;
  updateBackendNode: Thunk<
    NetworkModel,
    { id: number; lnName: string; backendName: string },
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
  toggleNode: Thunk<NetworkModel, CommonNode, StoreInjections, RootModel, Promise<void>>;
  monitorStartup: Thunk<
    NetworkModel,
    CommonNode[],
    StoreInjections,
    RootModel,
    Promise<void>
  >;
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
      version: APP_VERSION,
      networks: getState().networks,
      charts: getStoreState().designer.allCharts,
    };
    await injections.dockerService.saveNetworks(data);
  }),
  add: action((state, network) => {
    state.networks.push(network);
    info(`Added new network '${network.name}' to redux state`);
  }),
  addNetwork: thunk(
    async (
      actions,
      payload,
      { dispatch, getState, injections, getStoreState, getStoreActions },
    ) => {
      const { dockerRepoState } = getStoreState().app;
      const nextId = Math.max(0, ...getState().networks.map(n => n.id)) + 1;
      const { name, lndNodes, clightningNodes, bitcoindNodes } = payload;
      const network = createNetwork({
        id: nextId,
        name,
        lndNodes,
        clightningNodes,
        bitcoindNodes,
        repoState: dockerRepoState,
      });
      actions.add(network);
      const { networks } = getState();
      const newNetwork = networks[networks.length - 1];
      await injections.dockerService.saveComposeFile(newNetwork);
      const chart = initChartFromNetwork(newNetwork);
      getStoreActions().designer.setChart({ id: newNetwork.id, chart });
      await actions.save();
      dispatch(push(NETWORK_VIEW(newNetwork.id)));
    },
  ),
  addNode: thunk(
    async (actions, { id, type, version }, { getState, getStoreState, injections }) => {
      const { dockerRepoState } = getStoreState().app;
      const networks = getState().networks;
      const network = networks.find(n => n.id === id);
      if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
      let node: LightningNode | BitcoinNode;
      switch (type) {
        case 'LND':
          node = createLndNetworkNode(
            network,
            version,
            dockerRepoState.images.LND.compatibility,
          );
          network.nodes.lightning.push(node);
          break;
        case 'c-lightning':
          node = createCLightningNetworkNode(
            network,
            version,
            dockerRepoState.images['c-lightning'].compatibility,
          );
          network.nodes.lightning.push(node);
          break;
        case 'bitcoind':
          node = createBitcoindNetworkNode(network, version);
          network.nodes.bitcoin.push(node);
          break;
        default:
          throw new Error(`Cannot add unknown node type '${type}' to the network`);
      }
      actions.setNetworks([...networks]);
      await actions.save();
      await injections.dockerService.saveComposeFile(network);
      return node;
    },
  ),
  removeLightningNode: thunk(
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
      await injections.dockerService.saveComposeFile(network);
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
      await getStoreActions().designer.syncChart(network);
    },
  ),
  removeBitcoinNode: thunk(
    async (
      actions,
      { node },
      { getState, injections, getStoreState, getStoreActions },
    ) => {
      const networks = getState().networks;
      const network = networks.find(n => n.id === node.networkId);
      if (!network) throw new Error(l('networkByIdErr', { networkId: node.networkId }));
      const { dockerRepoState } = getStoreState().app;
      const { dockerService, lightningFactory } = injections;
      const { bitcoind, designer } = getStoreActions();
      const { bitcoin, lightning } = network.nodes;

      if (bitcoin.length === 1) throw new Error(l('removeLastErr'));
      const index = bitcoin.indexOf(node);
      const remaining = bitcoin.filter(n => n !== node);
      // update LN nodes to use a different backend. Use the first bitcoin node unless
      // it is the one being removed
      lightning
        .filter(n => n.backendName === node.name)
        .forEach(n => {
          try {
            const backends = filterCompatibleBackends(
              n.implementation,
              n.version,
              dockerRepoState.images[n.implementation].compatibility,
              remaining,
            );
            n.backendName = backends[0].name;
          } catch (error) {
            throw new Error(l('removeCompatErr', { lnName: n.name }));
          }
        });

      // bitcoin nodes are peered with the nodes immediately before and after. if the
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
      }
      // remove the node from the chart's redux state
      designer.removeNode(node.name);
      await designer.syncChart(network);
    },
  ),
  updateBackendNode: thunk(
    async (
      actions,
      { id, lnName, backendName },
      { injections, getState, getStoreActions },
    ) => {
      const networks = getState().networks;
      const network = networks.find(n => n.id === id);
      if (!network) throw new Error(l('networkByIdErr', { networkId: id }));
      const lnNode = network.nodes.lightning.find(n => n.name === lnName);
      if (!lnNode) throw new Error(l('nodeByNameErr', { name: lnName }));
      const btcNode = network.nodes.bitcoin.find(n => n.name === backendName);
      if (!btcNode) throw new Error(l('nodeByNameErr', { name: backendName }));
      if (lnNode.backendName === backendName)
        throw new Error(l('connectedErr', { lnName, backendName }));

      if (network.status === Status.Started) {
        // stop the LN node container
        actions.setStatus({ id: network.id, status: Status.Stopping, only: lnName });
        await injections.dockerService.stopNode(network, lnNode);
        actions.setStatus({ id: network.id, status: Status.Stopped, only: lnName });
      }

      // update the backend
      lnNode.backendName = btcNode.name;
      // update the network in the redux state and save to disk
      actions.setNetworks([...networks]);
      await actions.save();
      // save the updated compose file
      await injections.dockerService.saveComposeFile(network);

      if (network.status === Status.Started) {
        // start the LN node container
        actions.setStatus({ id: network.id, status: Status.Starting, only: lnName });
        await injections.dockerService.startNode(network, lnNode);
        await actions.monitorStartup([
          ...network.nodes.lightning,
          ...network.nodes.bitcoin,
        ]);
      }

      // update the link in the chart
      getStoreActions().designer.updateBackendLink({ lnName, backendName });
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
        // re-fetch the network with the updated ports
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
      // wait for nodes to startup before updating their status
      await actions.monitorStartup([
        ...network.nodes.lightning,
        ...network.nodes.bitcoin,
      ]);
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
  toggleNode: thunk(async (actions, node, { getState, injections }) => {
    const { networkId } = node;
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(l('networkByIdErr', { networkId }));
    const only = node.name;
    if (node.status === Status.Stopped || node.status === Status.Error) {
      // start the node container
      actions.setStatus({ id: network.id, status: Status.Starting, only });
      await injections.dockerService.startNode(network, node);
      await actions.monitorStartup([node]);
    } else if (node.status === Status.Started) {
      // stop the node container
      actions.setStatus({ id: network.id, status: Status.Stopping, only });
      await injections.dockerService.stopNode(network, node);
      actions.setStatus({ id: network.id, status: Status.Stopped, only });
    }
    await actions.save();
  }),
  monitorStartup: thunk(
    async (actions, nodes, { injections, getState, getStoreActions }) => {
      if (!nodes.length) return;
      const id = nodes[0].networkId;
      const network = getState().networks.find(n => n.id === id);
      if (!network) throw new Error(l('networkByIdErr', { networkId: id }));

      const allNodesOnline: Promise<void>[] = [];
      for (const node of nodes) {
        // wait for lnd nodes to come online before updating their status
        if (node.type === 'lightning') {
          const ln = node as LightningNode;
          // use .then() to continue execution while the promises are waiting to complete
          const promise = injections.lightningFactory
            .getService(ln)
            .waitUntilOnline(ln)
            .then(async () => {
              actions.setStatus({ id, status: Status.Started, only: ln.name });
            })
            .catch(error =>
              actions.setStatus({ id, status: Status.Error, only: ln.name, error }),
            );
          allNodesOnline.push(promise);
        } else if (node.type === 'bitcoin') {
          const btc = node as BitcoinNode;
          // wait for bitcoind nodes to come online before updating their status
          // use .then() to continue execution while the promises are waiting to complete
          injections.bitcoindService
            .waitUntilOnline(btc)
            .then(async () => {
              actions.setStatus({ id, status: Status.Started, only: btc.name });
              // connect each bitcoin node to it's peers so tx & block propagation is fast
              await injections.bitcoindService.connectPeers(btc);
              await getStoreActions().bitcoind.getInfo(btc);
            })
            .catch(error =>
              actions.setStatus({ id, status: Status.Error, only: btc.name, error }),
            );
        }
      }
      // after all LN nodes are online, connect each of them to each other. This helps
      // ensure that each node is aware of the entire graph and can route payments properly
      if (allNodesOnline.length) {
        Promise.all(allNodesOnline).then(async () => {
          await getStoreActions().lightning.connectAllPeers(network);
        });
      }
    },
  ),
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
    const statuses = [
      network.status,
      ...network.nodes.lightning.map(n => n.status),
      ...network.nodes.bitcoin.map(n => n.status),
    ];
    if (statuses.find(n => n !== Status.Stopped)) {
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
