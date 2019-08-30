import { info } from 'electron-log';
import { join } from 'path';
import { push } from 'connected-react-router';
import { Action, action, Computed, computed, memo, Thunk, thunk } from 'easy-peasy';
import { Network, Status, StoreInjections } from 'types';
import { dataPath } from 'utils/config';
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
  add: Action<NetworkModel, AddNetworkArgs>;
  addNetwork: Thunk<NetworkModel, AddNetworkArgs, StoreInjections, {}, Promise<void>>;
  setNetworkStatus: Action<NetworkModel, { id: number; status: Status }>;
  start: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  stop: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  toggle: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
}

const networkModel: NetworkModel = {
  // state properties
  networks: [],
  // computed properties/functions
  networkById: computed(state =>
    memo((id?: string | number) => {
      const networkId = typeof id === 'number' ? id : parseInt(id || '');
      const network = state.networks.find(n => n.id === networkId);
      if (!network) {
        throw new Error(`Network with the id '${networkId}' was not found.`);
      }
      return network;
    }, 10),
  ),
  // reducer actions (mutations allowed thx to immer)
  add: action((state, { name, lndNodes, bitcoindNodes }) => {
    const nextId = Math.max(0, ...state.networks.map(n => n.id)) + 1;
    const network: Network = {
      id: nextId,
      name,
      status: Status.Stopped,
      path: join(dataPath, 'networks', nextId.toString()),
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
      status: Status.Stopped,
    }));

    network.nodes.lightning = range(lndNodes).map((v, i) => ({
      id: i,
      name: `lnd-${i + 1}`,
      type: 'lightning',
      implementation: 'LND',
      status: Status.Stopped,
      backendName: network.nodes.bitcoin[0].name,
    }));

    state.networks.push(network);
    info(`Added new network '${network.name}' to redux sate`);
  }),
  addNetwork: thunk(async (actions, payload, { dispatch, getState, injections }) => {
    actions.add(payload);
    const { networks } = getState();
    const newNetwork = networks[networks.length - 1];
    await injections.dockerService.create(newNetwork);
    dispatch(push(NETWORK_VIEW(newNetwork.id)));
  }),
  setNetworkStatus: action((state, { id, status }) => {
    const network = state.networkById(id);
    network.status = status;
    network.nodes.bitcoin.forEach(n => (n.status = status));
    network.nodes.lightning.forEach(n => (n.status = status));
  }),
  start: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networkById(networkId);
    actions.setNetworkStatus({ id: network.id, status: Status.Starting });
    try {
      await injections.dockerService.start(network);
      actions.setNetworkStatus({ id: network.id, status: Status.Started });
    } catch (e) {
      actions.setNetworkStatus({ id: network.id, status: Status.Error });
      info(`unable to start containers for '${network.name}'`, e.message);
      throw e;
    }
  }),
  stop: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networkById(networkId);
    actions.setNetworkStatus({ id: network.id, status: Status.Stopping });
    try {
      await injections.dockerService.stop(network);
      actions.setNetworkStatus({ id: network.id, status: Status.Stopped });
    } catch (e) {
      actions.setNetworkStatus({ id: network.id, status: Status.Error });
      info(`unable to stop containers for '${network.name}'`, e.message);
      throw e;
    }
  }),
  toggle: thunk(async (actions, networkId, { getState }) => {
    const network = getState().networkById(networkId);
    if (network.status === Status.Stopped || network.status === Status.Error) {
      await actions.start(network.id);
    } else if (network.status === Status.Started) {
      await actions.stop(network.id);
    }
  }),
};

export default networkModel;
