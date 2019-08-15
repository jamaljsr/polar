import { Action, action, Thunk, thunk } from 'easy-peasy';
import { info } from 'electron-log';
import { push } from 'connected-react-router';
import networkManager from 'lib/docker/NetworkManager';

export interface NetworkModel {
  networks: Network[];
  add: Action<NetworkModel, string>;
  addNetwork: Thunk<NetworkModel, string>;
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
        bitcoinNodeId: 0,
      },
      {
        id: 0,
        name: 'bob',
        type: 'lightning',
        bitcoinNodeId: 0,
      },
    ],
  },
};

const networkModel: NetworkModel = {
  // state properties
  networks: [],
  // reducer actions (mutations allowed thx to immer)
  add: action((state, name) => {
    const network = { ...basicNetwork, name };
    state.networks.push(network);
    info(`Added new network '${network.name}' to redux sate`);
  }),
  addNetwork: thunk(async (actions, payload, { dispatch, getState }) => {
    actions.add(payload);
    const { networks } = getState();
    networkManager.start(networks[networks.length - 1]);
    dispatch(push('/'));
  }),
};

export default networkModel;
