import { createStore } from 'easy-peasy';
import { LitdNode } from 'shared/types';
import { Session } from 'lib/litd/types';
import { initChartFromNetwork } from 'utils/chart';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import {
  defaultLitSession,
  injections,
  litdServiceMock,
  testManagedImages,
} from 'utils/tests';
import appModel from './app';
import bitcoindModel from './bitcoind';
import designerModel from './designer';
import lightningModel from './lightning';
import litModel from './lit';
import networkModel from './network';

describe('LIT Model', () => {
  const rootModel = {
    app: appModel,
    network: networkModel,
    lightning: lightningModel,
    bitcoind: bitcoindModel,
    designer: designerModel,
    lit: litModel,
  };
  const network = createNetwork({
    id: 1,
    name: 'my network',
    lndNodes: 0,
    clightningNodes: 0,
    eclairNodes: 0,
    bitcoindNodes: 1,
    tapdNodes: 0,
    litdNodes: 1,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
  });
  const initialState = {
    network: {
      networks: [network],
    },
    designer: {
      activeId: 1,
      allCharts: {
        1: initChartFromNetwork(network),
      },
    },
  };
  // initialize store for type inference
  let store = createStore(rootModel, { injections, initialState });
  const node = initialState.network.networks[0].nodes.lightning[0] as LitdNode;

  beforeEach(() => {
    // reset the store before each test run
    store = createStore(rootModel, { injections, initialState });

    litdServiceMock.listSessions.mockResolvedValue([
      defaultLitSession({
        label: 'test',
      }),
    ]);
    litdServiceMock.addSession.mockResolvedValue(
      defaultLitSession({
        label: 'add test',
      }),
    );
  });

  it('should have a valid initial state', () => {
    expect(store.getState().lit.nodes).toEqual({});
  });

  it('should update state with getSessions response', async () => {
    await store.getActions().lit.getSessions(node);
    const nodeState = store.getState().lit.nodes[node.name];
    expect(nodeState.sessions).toBeDefined();
    const sessions = nodeState.sessions as Session[];
    expect(sessions[0].label).toEqual('test');
  });

  it('should add a session', async () => {
    await store.getActions().lit.addSession({
      node,
      label: 'add test',
      type: 'Admin',
      expiresAt: 123456,
      mailboxServerAddr: 'test.mailbox.com',
    });
    const nodeState = store.getState().lit.nodes[node.name];
    expect(nodeState.sessions).toBeDefined();
    const sessions = nodeState.sessions as Session[];
    expect(sessions[0].label).toEqual('test');
  });

  it('should revoke a session', async () => {
    await expect(
      store.getActions().lit.revokeSession({
        node,
        localPublicKey: 'abcdef',
      }),
    ).resolves.not.toThrow();
    expect(litdServiceMock.revokeSession).toHaveBeenCalledWith(node, 'abcdef');
  });

  it('should remove node state', async () => {
    await store.getActions().lit.getSessions(node);
    expect(store.getState().lit.nodes[node.name]).toBeDefined();
    store.getActions().lit.removeNode(node.name);
    expect(store.getState().lit.nodes[node.name]).toBeUndefined();
  });
});
