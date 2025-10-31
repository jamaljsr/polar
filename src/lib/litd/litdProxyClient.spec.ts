import { ipcChannels } from 'shared';
import { LitdNode } from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from 'utils/network';
import { testManagedImages } from 'utils/tests';
import litdProxyClient from './litdProxyClient';

describe('LitdProxyClient', () => {
  const network = createNetwork({
    id: 1,
    name: 'my network',
    description: 'network description',
    lndNodes: 0,
    clightningNodes: 0,
    eclairNodes: 0,
    bitcoindNodes: 1,
    tapdNodes: 0,
    litdNodes: 1,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
    manualMineCount: 6,
  });
  const node = network.nodes.lightning[0] as LitdNode;
  let actualIpc: IpcSender;

  beforeEach(() => {
    actualIpc = litdProxyClient.ipc;
    // mock the ipc dependency
    litdProxyClient.ipc = jest.fn();
  });

  afterEach(() => {
    // restore the actual ipc implementation
    litdProxyClient.ipc = actualIpc;
  });

  it('should call the status ipc', () => {
    litdProxyClient.status(node);
    expect(litdProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.litd.status, { node });
  });

  it('should call the listSessions ipc', () => {
    litdProxyClient.listSessions(node);
    expect(litdProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.litd.listSessions, {
      node,
    });
  });

  it('should call the addSession ipc', () => {
    const req = {
      label: 'Test Session',
      type: 'TYPE_MACAROON_ADMIN',
      expiryTimestampSeconds: 123456,
      mailboxServerAddr: 'test.mailbox.com',
    };
    litdProxyClient.addSession(node, req);
    expect(litdProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.litd.addSession, {
      node,
      req,
    });
  });

  it('should call the revokeSession ipc', () => {
    const req = {
      localPublicKey: Buffer.from('abcdef'),
    };
    litdProxyClient.revokeSession(node, req);
    expect(litdProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.litd.revokeSession, {
      node,
      req,
    });
  });
});
