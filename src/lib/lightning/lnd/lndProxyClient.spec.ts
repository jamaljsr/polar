import { ipcChannels } from 'shared';
import { LndNode } from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';

describe('LndService', () => {
  const node = getNetwork().nodes.lightning[0] as LndNode;
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
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.getInfo, { node });
  });

  it('should call the getWalletBalance ipc', () => {
    lndProxyClient.getWalletBalance(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.walletBalance, { node });
  });

  it('should call the getNewAddress ipc', () => {
    lndProxyClient.getNewAddress(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.newAddress, { node });
  });

  it('should call the listPeers ipc', () => {
    lndProxyClient.listPeers(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.listPeers, { node });
  });

  it('should call the connectPeer ipc', () => {
    const req = { addr: { pubkey: 'abcdef', host: 'alice' } };
    lndProxyClient.connectPeer(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.connectPeer, {
      node,
      req,
    });
  });

  it('should call the openChannel ipc', () => {
    const req = {
      nodePubkeyString: 'asdf',
      localFundingAmount: '1000',
    };
    lndProxyClient.openChannel(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.openChannel, {
      node,
      req,
    });
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
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.closeChannel, {
      node,
      req,
    });
  });

  it('should call the listChannels ipc', () => {
    const req = {};
    lndProxyClient.listChannels(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.listChannels, {
      node,
      req,
    });
  });

  it('should call the pendingChannels ipc', () => {
    lndProxyClient.pendingChannels(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.pendingChannels, {
      node,
    });
  });

  it('should call the createInvoice ipc', () => {
    const req = {};
    lndProxyClient.createInvoice(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.createInvoice, {
      node,
      req,
    });
  });

  it('should call the payInvoice ipc', () => {
    const req = {};
    lndProxyClient.payInvoice(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.payInvoice, {
      node,
      req,
    });
  });

  it('should call the decodeInvoice ipc', () => {
    const req = { payReq: 'lnbc1invoice' };
    lndProxyClient.decodeInvoice(node, req);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.decodeInvoice, {
      node,
      req,
    });
  });

  it('should call the setupListener ipc', () => {
    lndProxyClient.setupListener(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.setupListener, { node });
  });

  it('should call the removeListener ipc', () => {
    lndProxyClient.removeListener(node);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(ipcChannels.removeListener, { node });
  });

  it('should call the subscribeChannelEvents ipc', () => {
    const callback = jest.fn();
    lndProxyClient.subscribeChannelEvents(node, callback);
    expect(lndProxyClient.ipc).toHaveBeenCalledWith(
      ipcChannels.subscribeChannelEvents,
      { node },
      callback,
    );
  });
});
