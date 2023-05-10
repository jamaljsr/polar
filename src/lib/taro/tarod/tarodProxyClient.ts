import * as TARO from '@hodlone/taro-api';
import { ipcChannels } from 'shared';
import { TarodNode } from 'shared/types';
import { createIpcSender, IpcSender } from 'lib/ipc/ipcService';

class TarodProxyClient {
  ipc: IpcSender;

  constructor() {
    this.ipc = createIpcSender('TarodProxyClient', 'tarod');
  }

  async mintAsset(
    node: TarodNode,
    req: TARO.MintAssetRequestPartial,
  ): Promise<TARO.MintAssetResponse> {
    return await this.ipc(ipcChannels.taro.mintAsset, { node, req });
  }

  async listAssets(node: TarodNode): Promise<TARO.ListAssetResponse> {
    return await this.ipc(ipcChannels.taro.listAssets, { node });
  }

  async listBalances(
    node: TarodNode,
    req: TARO.ListBalancesRequestPartial,
  ): Promise<TARO.ListBalancesResponse> {
    return await this.ipc(ipcChannels.taro.listBalances, { node, req });
  }

  async newAddress(node: TarodNode, req: TARO.NewAddrRequestPartial): Promise<TARO.Addr> {
    return await this.ipc(ipcChannels.taro.newAddress, { node, req });
  }
  async sendAsset(
    node: TarodNode,
    req: TARO.SendAssetRequestPartial,
  ): Promise<TARO.SendAssetResponse> {
    return await this.ipc(ipcChannels.taro.sendAsset, { node, req });
  }
  async decodeAddress(
    node: TarodNode,
    req: TARO.DecodeAddrRequestPartial,
  ): Promise<TARO.Addr> {
    return await this.ipc(ipcChannels.taro.decodeAddress, { node, req });
  }
}

export default new TarodProxyClient();
