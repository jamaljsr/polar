import * as TAP from '@lightningpolar/tapd-api';
import { ipcChannels } from 'shared';
import { TapdNode } from 'shared/types';
import { IpcSender } from 'lib/ipc/ipcService';
import { getNetwork } from 'utils/tests';
import tapdProxyClient from './tapdProxyClient';

describe('TapdProxyClient', () => {
  const node = getNetwork(1, 'test network', undefined, 2).nodes.tap[0] as TapdNode;
  let actualIpc: IpcSender;

  beforeEach(() => {
    actualIpc = tapdProxyClient.ipc;
    // mock the ipc dependency
    tapdProxyClient.ipc = jest.fn();
  });

  afterEach(() => {
    // restore the actual ipc implementation
    tapdProxyClient.ipc = actualIpc;
  });

  it('should call the mintAsset ipc', () => {
    const req: TAP.MintAssetRequestPartial = {
      asset: {
        assetMeta: {
          type: TAP.AssetMetaType.META_TYPE_OPAQUE,
          data: Buffer.from('test data').toString('base64'),
        },
        name: 'test',
        amount: '1000',
      },
    };
    tapdProxyClient.mintAsset(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.mintAsset, {
      node,
      req,
    });
  });

  it('should call the finalizeBatch ipc', () => {
    tapdProxyClient.finalizeBatch(node);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.finalizeBatch, { node });
  });

  it('should call the listAssets ipc', () => {
    tapdProxyClient.listAssets(node);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.listAssets, { node });
  });

  it('should call the listBalances ipc', () => {
    const req = {};
    tapdProxyClient.listBalances(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.listBalances, {
      node,
      req,
    });
  });

  it('should call the newAddress ipc', () => {
    const req: TAP.NewAddrRequestPartial = {
      assetId: 'test asset id',
      amt: '1000',
    };
    tapdProxyClient.newAddress(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.newAddress, {
      node,
      req,
    });
  });

  it('should call the sendAsset ipc', () => {
    const req: TAP.SendAssetRequestPartial = {
      tapAddrs: ['tap1test'],
    };
    tapdProxyClient.sendAsset(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.sendAsset, {
      node,
      req,
    });
  });

  it('should call the decodeAddress ipc', () => {
    const req: TAP.DecodeAddrRequestPartial = {
      addr: 'tap1test',
    };
    tapdProxyClient.decodeAddress(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.decodeAddress, {
      node,
      req,
    });
  });

  it('should call the assetRoots ipc', () => {
    tapdProxyClient.assetRoots(node);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.assetRoots, {
      node,
    });
  });

  it('should call the assetLeaves ipc', () => {
    const req: TAP.IDPartial = {
      assetId: 'test asset id',
    };
    tapdProxyClient.assetLeaves(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.assetLeaves, {
      node,
      req,
    });
  });

  it('should call the syncUniverse ipc', () => {
    const req: TAP.SyncRequestPartial = {
      universeHost: '1.2.3.4:10029',
    };
    tapdProxyClient.syncUniverse(node, req);
    expect(tapdProxyClient.ipc).toBeCalledWith(ipcChannels.tapd.syncUniverse, {
      node,
      req,
    });
  });
});
