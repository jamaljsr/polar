import { Action, action, Thunk, thunk, Computed, computed, memo } from 'easy-peasy';
import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { Network, Status, StoreInjections } from 'types';
import { NETWORK_VIEW } from 'components/routing';
import { range } from 'utils/numbers';

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
  setNetworkStarting: Action<NetworkModel, number>;
  setNetworkStarted: Action<NetworkModel, number>;
  start: Thunk<NetworkModel, number, StoreInjections, {}, Promise<void>>;
  setNetworkError: Action<NetworkModel, number>;
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
    await injections.networkManager.create(newNetwork);
    dispatch(push(NETWORK_VIEW(newNetwork.id)));
  }),
  setNetworkStarting: action((state, networkId) => {
    state.networkById(networkId).status = Status.Starting;
  }),
  setNetworkStarted: action((state, networkId) => {
    state.networkById(networkId).status = Status.Started;
  }),
  start: thunk(async (actions, networkId, { getState, injections }) => {
    const network = getState().networkById(networkId);
    actions.setNetworkStarting(network.id);
    try {
      await injections.dockerService.start(network);
      actions.setNetworkStarted(network.id);
    } catch (e) {
      actions.setNetworkError(network.id);
      info(`unable to start containers for '${network.name}'`, JSON.stringify(e));
      throw e;
    }
  }),
  setNetworkError: action((state, networkId) => {
    state.networkById(networkId).status = Status.Error;
  }),
};

export default networkModel;
