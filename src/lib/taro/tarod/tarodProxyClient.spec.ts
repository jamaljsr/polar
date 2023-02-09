import { ipcChannels } from 'shared';
import { TarodNode } from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import tarodProxyClient from './tarodProxyClient';

describe('TarodProxyClient', () => {
  const node = getNetwork(1, 'test network', undefined, 2).nodes.taro[0] as TarodNode;
  let actualIpc: IpcSender;

  beforeEach(() => {
    actualIpc = tarodProxyClient.ipc;
    // mock the ipc dependency
    tarodProxyClient.ipc = jest.fn();
  });

  afterEach(() => {
    // restore the actual ipc implementation
    tarodProxyClient.ipc = actualIpc;
  });

  it('should call the mintAsset ipc', () => {
    const req = {
      name: 'test',
      amount: '1000',
      metaData: 'test data',
    };
    tarodProxyClient.mintAsset(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.mintAsset, {
      node,
      req,
    });
  });

  it('should call the listAssets ipc', () => {
    tarodProxyClient.listAssets(node);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.listAssets, { node });
  });

  it('should call the listBalances ipc', () => {
    const req = {};
    tarodProxyClient.listBalances(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.listBalances, {
      node,
      req,
    });
  });

  it('should call the newAddress ipc', () => {
    const req = {
      genesisBootstrapInfo: 'test genesis',
      amt: '1000',
    };
    tarodProxyClient.newAddress(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.newAddress, {
      node,
      req,
    });
  });
  it('should call the send ipc', () => {
    const req = {
      taroAddr: 'taro1test',
    };
    tarodProxyClient.sendAsset(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.sendAsset, {
      node,
      req,
    });
  });
  it('should call the decodeAddress ipc', () => {
    const req = {
      addr: 'taro1test',
    };
    tarodProxyClient.decodeAddress(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.decodeAddress, {
      node,
      req,
    });
  });
});
