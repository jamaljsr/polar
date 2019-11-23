import { ipcChannels } from 'shared';
import { IpcSender } from 'lib/ipc/ipcService';
import { groupNodes } from 'utils/network';
import { getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';

describe('LndService', () => {
  const node = groupNodes(getNetwork()).lnd[0];
  let actualIpc: IpcSender;

  beforeEach(() => {
    actualIpc = lndProxyClient.ipc;
    // mock the ipc dependency
    lndProxyClient.ipc = jest.fn();
  });

  afterEach(() => {
    // restore the actual ipc implementation
    lndProxyClient.ipc = actualIpc;
  });

  it('should call the getInfo ipc', () => {
    lndProxyClient.getInfo(node);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.getInfo, { node });
  });

  it('should call the getWalletBalance ipc', () => {
    lndProxyClient.getWalletBalance(node);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.walletBalance, { node });
  });

  it('should call the getNewAddress ipc', () => {
    lndProxyClient.getNewAddress(node);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.newAddress, { node });
  });

  it('should call the listPeers ipc', () => {
    lndProxyClient.listPeers(node);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.listPeers, { node });
  });

  it('should call the connectPeer ipc', () => {
    const req = { addr: { pubkey: 'abcdef', host: 'alice' } };
    lndProxyClient.connectPeer(node, req);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.connectPeer, { node, req });
  });

  it('should call the openChannel ipc', () => {
    const req = {
      nodePubkeyString: 'asdf',
      localFundingAmount: '1000',
    };
    lndProxyClient.openChannel(node, req);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.openChannel, { node, req });
  });

  it('should call the closeChannel ipc', () => {
    const req = {
      channelPoint: {
        fundingTxidBytes: Buffer.from('txid'),
        fundingTxidStr: 'txid',
        outputIndex: 0,
      },
    };
    lndProxyClient.closeChannel(node, req);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.closeChannel, { node, req });
  });

  it('should call the listChannels ipc', () => {
    const req = {};
    lndProxyClient.listChannels(node, req);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.listChannels, { node, req });
  });

  it('should call the pendingChannels ipc', () => {
    lndProxyClient.pendingChannels(node);
    expect(lndProxyClient.ipc).toBeCalledWith(ipcChannels.pendingChannels, { node });
  });
});
