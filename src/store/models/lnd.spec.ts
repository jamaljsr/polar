import { GetInfoResponse } from '@radar/lnrpc';
import { createStore } from 'easy-peasy';
import { LndLibrary } from 'types';
import * as files from 'utils/files';
import { getNetwork, injections, mockLndResponses } from 'utils/tests';
import lndModel from './lnd';

jest.mock('utils/files', () => ({
  waitForFile: jest.fn(),
}));

const filesMock = files as jest.Mocked<typeof files>;
const lndServiceMock = injections.lndService as jest.Mocked<LndLibrary>;

describe('LND Model', () => {
  // initialize store for type inference
  let store = createStore({ lnd: lndModel }, { injections });
  const node = getNetwork().nodes.lightning[0];

  beforeEach(() => {
    // reset the store before each test run
    store = createStore({ lnd: lndModel }, { injections });
  });

  it('should have a valid initial state', () => {
    expect(store.getState().lnd.nodes).toEqual({});
  });

  describe('initialize', () => {
    it('should initialize a new node', async () => {
      filesMock.waitForFile.mockResolvedValue(true);
      const { initialize } = store.getActions().lnd;
      await initialize(node);
      const expected = { [node.name]: { initialized: true } };
      expect(store.getState().lnd.nodes).toEqual(expected);
    });

    it('should do nothing if the node is already initialized', async () => {
      filesMock.waitForFile.mockResolvedValue(true);
      const { initialize } = store.getActions().lnd;
      await initialize(node);
      const expected = { [node.name]: { initialized: true } };
      expect(store.getState().lnd.nodes).toEqual(expected);
      await initialize(node);
      expect(store.getState().lnd.nodes).toEqual(expected);
    });

    it('should throw an error if the macaroon does not exist on disk', async () => {
      filesMock.waitForFile.mockResolvedValue(false);
      const { initialize } = store.getActions().lnd;
      await expect(initialize(node)).rejects.toThrow(/admin.macaroon not found/);
    });
  });

  describe('getInfo', () => {
    beforeEach(async () => {
      lndServiceMock.getInfo.mockResolvedValue({
        ...mockLndResponses.getInfo,
        alias: 'my-node',
        identityPubkey: 'abcdef',
        syncedToChain: true,
      });
    });

    it('should update state if successful', async () => {
      filesMock.waitForFile.mockReturnValue(Promise.resolve(true));
      await store.getActions().lnd.initialize(node);
      const { getInfo } = store.getActions().lnd;
      await getInfo(node);
      const nodeState = store.getState().lnd.nodes[node.name];
      expect(nodeState.info).toBeTruthy();
      const info = nodeState.info as GetInfoResponse;
      expect(info.alias).toEqual('my-node');
      expect(info.identityPubkey).toEqual('abcdef');
      expect(info.syncedToChain).toEqual(true);
    });

    it('should throw an error if the node has not been initialized', async () => {
      const { getInfo } = store.getActions().lnd;
      await expect(getInfo(node)).rejects.toThrow(/has not been started/);
    });
  });
});
