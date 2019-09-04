import { info } from 'electron-log';
import { join } from 'path';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, Thunk, thunk } from 'easy-peasy';
import { Network, Status, StoreInjections } from 'types';
import { networksPath } from 'utils/config';
import { range } from 'utils/numbers';
import { NETWORK_VIEW } from 'components/routing';

interface AddNetworkArgs {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

export interface NetworkModel {
  networks: Network[];
  networkById: Computed<NetworkModel, (id?: string | number) => Network>;
  setNetworks: Action<NetworkModel, Network[]>;
  load: Thunk<NetworkModel, any, StoreInjections, {}, Promise<void>>;
  add: Action<NetworkModel, AddNetworkArgs>;
  addNetwork: Thunk<NetworkModel, AddNetworkArgs, StoreInjections, {}, Promise<void>>;
  setNetworkStatus: Action<NetworkModel, { id: number; status: Status }>;
  start: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  pullImages: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
}
const networkModel: NetworkModel = {
  // state properties
  networks: [],

  // computed properties/functions
  /**
   * returns a function to fetch a network by id. Do not use this inside of
   * other actions/thunks because immer will not detect mutations correctly
   */
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
  load: thunk(async (actions, payload, { injections }) => {
    const networks = await injections.dockerService.load();
    if (networks && networks.length) {
      actions.setNetworks(networks);
    }
  }),
  add: action((state, { name, lndNodes, bitcoindNodes }) => {
    const nextId = Math.max(0, ...state.networks.map(n => n.id)) + 1;
    const network: Network = {
      id: nextId,
      name,
      status: Status.Stopped,
      path: join(networksPath, nextId.toString()),
      nodes: {
        bitcoin: [],
        lightning: [],
      },
    };

    network.nodes.bitcoin = range(bitcoindNodes).map((v, i) => ({
      id: i,
      name: `bitcoind-${i + 1}`,
      type: 'bitcoin',
      implementation: 'bitcoind',
      version: '0.18.1',
      status: Status.Stopped,
    }));

    network.nodes.lightning = range(lndNodes).map((v, i) => ({
      id: i,
      name: `lnd-${i + 1}`,
      type: 'lightning',
      implementation: 'lnd',
      version: '0.7.1-beta',
      status: Status.Stopped,
      backendName: network.nodes.bitcoin[0].name,
    }));

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
  pullImages: thunk(async (actions, networkId, { getState }) => {
    const network = getState().networks.find(n => n.id === networkId);
    if (!network) throw new Error(`Network with the id '${networkId}' was not found.`);
    info(`pulling docker images for network '${network.name}'`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    info(`successfully pulled docker images for network '${network.name}'`);
  }),
};

export default networkModel;
