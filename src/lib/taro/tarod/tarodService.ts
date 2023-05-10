import * as TARO from '@hodlone/taro-api';
import { TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { TaroService } from 'types';
import { waitFor } from 'utils/async';
import { tarodProxyClient as proxy } from './';

class TarodService implements TaroService {
  async decodeAddress(
    node: TaroNode,
    req: TARO.DecodeAddrRequestPartial,
  ): Promise<PTARO.TaroAddress> {
    const res = await proxy.decodeAddress(this.cast(node), req);
    return {
      encoded: res.encoded,
      id: res.assetId.toString(),
      type: res.assetType,
      amount: res.amount,
      family: res.groupKey.toString(),
      scriptKey: res.scriptKey.toString(),
      internalKey: res.internalKey.toString(),
      taprootOutputKey: res.taprootOutputKey.toString(),
    };
  }

  async sendAsset(
    node: TaroNode,
    req: TARO.SendAssetRequestPartial,
  ): Promise<PTARO.TaroSendAssetReceipt> {
    const res = await proxy.sendAsset(this.cast(node), req);
    const transfer = res.transfer as TARO.AssetTransfer;
    return {
      transferTxid: transfer.anchorTxHash.toString('hex'),
    };
  }

  async newAddress(
    node: TaroNode,
    assetId: string,
    amt: string,
  ): Promise<PTARO.TaroAddress> {
    const res = await proxy.newAddress(this.cast(node), {
      assetId: Buffer.from(assetId, 'hex'),
      amt,
    });
    return {
      encoded: res.encoded,
      id: res.assetId.toString(),
      type: res.assetType,
      amount: res.amount,
      family: res.groupKey?.toString(),
      scriptKey: res.scriptKey.toString(),
      internalKey: res.internalKey.toString(),
      taprootOutputKey: res.taprootOutputKey.toString(),
    };
  }

  async mintAsset(
    node: TaroNode,
    req: TARO.MintAssetRequestPartial,
  ): Promise<TARO.MintAssetResponse> {
    return await proxy.mintAsset(this.cast(node), req);
  }

  async finalizeBatch(node: TaroNode): Promise<TARO.FinalizeBatchResponse> {
    return await proxy.finalizeBatch(this.cast(node));
  }

  async listAssets(node: TaroNode): Promise<PTARO.TaroAsset[]> {
    const { assets } = await proxy.listAssets(this.cast(node));
    return assets.map<PTARO.TaroAsset>(asset => {
      // cast the nested object to be Required to avoid a bunch of
      // conditionals to please Typescript
      const genesis = asset.assetGenesis as Required<TARO.GenesisInfo>;
      const anchor = asset.chainAnchor as Required<TARO.AnchorInfo>;
      return {
        id: genesis.assetId.toString(),
        name: genesis.name,
        meta: genesis.metaHash.toString('ascii'),
        type: asset.assetType,
        amount: asset.amount,
        genesisPoint: genesis.genesisPoint,
        genesisBootstrapInfo: 'REMOVE-ME', //genesis.genesisBootstrapInfo.toString(),
        anchorOutpoint: anchor.anchorOutpoint,
      };
    });
  }

  async listBalances(node: TaroNode): Promise<PTARO.TaroBalance[]> {
    const balances: PTARO.TaroBalance[] = [];
    const res = await proxy.listBalances(this.cast(node), { assetId: true });
    Object.entries(res.assetBalances).forEach(([id, asset]) => {
      // cast the nested object to be Required to avoid a bunch of
      // conditionals to please Typescript
      const genesis = asset.assetGenesis as Required<TARO.GenesisInfo>;
      balances.push({
        id,
        name: genesis.name,
        meta: genesis.metaHash.toString('ascii'),
        type: asset.assetType,
        balance: asset.balance,
        genesisPoint: genesis.genesisPoint,
        genesisBootstrapInfo: 'REMOVE-ME', //genesis.genesisBootstrapInfo.toString(),
      });
    });
    return balances;
  }

  async assetRoots(node: TaroNode): Promise<PTARO.TaroAssetRoot[]> {
    const { universeRoots } = await proxy.assetRoots(this.cast(node));
    const assetRoots = Object.entries(universeRoots).map(([id, root]) => {
      return {
        id,
        name: root.assetName,
        rootSum: root.mssmtRoot?.rootSum || 0,
      } as PTARO.TaroAssetRoot;
    });
    return assetRoots;
  }

  async syncUniverse(node: TaroNode, universeHost: string): Promise<TARO.SyncResponse> {
    return await proxy.syncUniverse(this.cast(node), { universeHost });
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: TaroNode,
    interval = 3 * 1000, // check every 3 seconds
    timeout = 120 * 1000, // timeout after 120 seconds
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.listAssets(node);
      },
      interval,
      timeout,
    );
  }

  private cast(node: TaroNode): TarodNode {
    if (node.implementation !== 'tarod')
      throw new Error(`TarodService cannot be used for '${node.implementation}' nodes`);

    return node as TarodNode;
  }
}

export default new TarodService();
