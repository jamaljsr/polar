import { ipcChannels } from 'shared';
import * as TARO from 'shared/tarodTypes';
import { TarodNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class TarodProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('TarodProxyClient', 'tarod');
  }
  async mintAsset(
    node: TarodNode,
    req: TARO.MintAssetRequest,
  ): Promise<TARO.MintAssetResponse> {
    return await this.ipc(ipcChannels.taro.mintAsset, { node, req });
  }

  async listAssets(node: TarodNode): Promise<TARO.ListAssetResponse> {
    console.log('listing assets');
    return await this.ipc(ipcChannels.taro.listAssets, { node });
  }

  async listBalances(
    node: TarodNode,
    req: TARO.ListBalancesRequest,
  ): Promise<TARO.ListBalancesResponse> {
    return await this.ipc(ipcChannels.taro.listBalances, { node, req });
  }
  async newAddress(
    node: TarodNode,
    req: TARO.NewAddressRequest,
  ): Promise<TARO.NewAddressResponse> {
    return await this.ipc(ipcChannels.taro.newAddress, { node, req });
  }
  async sendAsset(
    node: TarodNode,
    req: TARO.SendAssetRequest,
  ): Promise<TARO.SendAssetResponse> {
    return await this.ipc(ipcChannels.taro.sendAsset, { node, req });
  }
}

export default new TarodProxyClient();
