import { Action, action, Thunk, thunk, Computed, computed, memo } from 'easy-peasy';
import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { Network, Status } from 'types';
import { NETWORK_VIEW } from 'components/Routes';
import { range } from 'utils/numbers';

interface AddNetworkArgs {
  name: string;
  lndNodes: number;
  bitcoindNodes: number;
}

export interface NetworkModel {
  networks: Network[];
  add: Action<NetworkModel, AddNetworkArgs>;
  addNetwork: Thunk<NetworkModel, AddNetworkArgs>;
  networkById: Computed<NetworkModel, (id?: string) => Network | undefined>;
}

const networkModel: NetworkModel = {
  // state properties
  networks: [],
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
  networkById: computed(state =>
    memo((id?: string) => {
      const networkId: number = parseInt(id || '');
      return state.networks.find(n => n.id === networkId);
    }, 10),
  ),
};

export default networkModel;
