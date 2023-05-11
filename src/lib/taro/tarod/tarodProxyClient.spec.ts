import * as TARO from '@hodlone/taro-api';
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
    const req: TARO.MintAssetRequestPartial = {
      asset: {
        assetMeta: {
          type: TARO.AssetMetaType.MTEA_TYPE_OPAQUE,
          data: Buffer.from('test data').toString('base64'),
        },
        name: 'test',
        amount: '1000',
      },
    };
    tarodProxyClient.mintAsset(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.mintAsset, {
      node,
      req,
    });
  });

  it('should call the finalizeBatch ipc', () => {
    tarodProxyClient.finalizeBatch(node);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.finalizeBatch, { node });
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
    const req: TARO.NewAddrRequestPartial = {
      assetId: 'test asset id',
      amt: '1000',
    };
    tarodProxyClient.newAddress(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.newAddress, {
      node,
      req,
    });
  });

  it('should call the sendAsset ipc', () => {
    const req: TARO.SendAssetRequestPartial = {
      taroAddrs: ['taro1test'],
    };
    tarodProxyClient.sendAsset(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.sendAsset, {
      node,
      req,
    });
  });

  it('should call the decodeAddress ipc', () => {
    const req: TARO.DecodeAddrRequestPartial = {
      addr: 'taro1test',
    };
    tarodProxyClient.decodeAddress(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.decodeAddress, {
      node,
      req,
    });
  });

  it('should call the assetRoots ipc', () => {
    tarodProxyClient.assetRoots(node);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.assetRoots, {
      node,
    });
  });

  it('should call the assetLeaves ipc', () => {
    const req: TARO.IDPartial = {
      assetId: 'test asset id',
    };
    tarodProxyClient.assetLeaves(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.assetLeaves, {
      node,
      req,
    });
  });

  it('should call the syncUniverse ipc', () => {
    const req: TARO.SyncRequestPartial = {
      universeHost: '1.2.3.4:10029',
    };
    tarodProxyClient.syncUniverse(node, req);
    expect(tarodProxyClient.ipc).toBeCalledWith(ipcChannels.taro.syncUniverse, {
      node,
      req,
    });
  });
});
