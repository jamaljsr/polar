import { Action, action, Thunk, thunk, Computed, computed, memo } from 'easy-peasy';
import { info } from 'electron-log';
import { push } from 'connected-react-router';
import { NETWORK_VIEW } from 'components/Routes';

export interface NetworkModel {
  networks: Network[];
  add: Action<NetworkModel, string>;
  addNetwork: Thunk<NetworkModel, string>;
  networkById: Computed<NetworkModel, (id?: string) => Network | undefined>;
}

const basicNetwork: Network = {
  id: 0,
  name: '',
  nodes: {
    bitcoin: [
      {
        id: 0,
        name: 'bitcoind1',
        type: 'bitcoin',
      },
    ],
    lightning: [
      {
        id: 0,
        name: 'alice',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
      {
        id: 1,
        name: 'bob',
        type: 'lightning',
        backendName: 'bitcoind1',
      },
    ],
  },
};

const networkModel: NetworkModel = {
  // state properties
  networks: [],
  // reducer actions (mutations allowed thx to immer)
  add: action((state, name) => {
    const network = {
      ...basicNetwork,
      id: state.networks.length,
      name,
    };
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
