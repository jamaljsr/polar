import * as TAP from '@lightningpolar/tapd-api';
import { ipcChannels } from 'shared';
import { TapdNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class TapdProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('TapdProxyClient', 'tapd');
  }

  async mintAsset(
    node: TapdNode,
    req: TAP.MintAssetRequestPartial,
  ): Promise<TAP.MintAssetResponse> {
    return await this.ipc(ipcChannels.tapd.mintAsset, { node, req });
  }

  async finalizeBatch(node: TapdNode): Promise<TAP.FinalizeBatchResponse> {
    return await this.ipc(ipcChannels.tapd.finalizeBatch, { node });
  }

  async listAssets(node: TapdNode): Promise<TAP.ListAssetResponse> {
    return await this.ipc(ipcChannels.tapd.listAssets, { node });
  }

  async listBalances(
    node: TapdNode,
    req: TAP.ListBalancesRequestPartial,
  ): Promise<TAP.ListBalancesResponse> {
    return await this.ipc(ipcChannels.tapd.listBalances, { node, req });
  }

  async newAddress(node: TapdNode, req: TAP.NewAddrRequestPartial): Promise<TAP.Addr> {
    return await this.ipc(ipcChannels.tapd.newAddress, { node, req });
  }

  async sendAsset(
    node: TapdNode,
    req: TAP.SendAssetRequestPartial,
  ): Promise<TAP.SendAssetResponse> {
    return await this.ipc(ipcChannels.tapd.sendAsset, { node, req });
  }

  async decodeAddress(
    node: TapdNode,
    req: TAP.DecodeAddrRequestPartial,
  ): Promise<TAP.Addr> {
    return await this.ipc(ipcChannels.tapd.decodeAddress, { node, req });
  }

  async assetRoots(node: TapdNode): Promise<TAP.AssetRootResponse> {
    return await this.ipc(ipcChannels.tapd.assetRoots, { node });
  }

  async assetLeaves(node: TapdNode, req: TAP.IDPartial): Promise<TAP.AssetLeafResponse> {
    return await this.ipc(ipcChannels.tapd.assetLeaves, { node, req });
  }

  async syncUniverse(
    node: TapdNode,
    req: TAP.SyncRequestPartial,
  ): Promise<TAP.SyncResponse> {
    return await this.ipc(ipcChannels.tapd.syncUniverse, { node, req });
  }
}

export default new TapdProxyClient();
