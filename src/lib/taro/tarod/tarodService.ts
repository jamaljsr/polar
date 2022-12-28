import { AnchorInfo } from '@hodlone/taro-api/dist/types/tarorpc/AnchorInfo';
import { GenesisInfo } from '@hodlone/taro-api/dist/types/tarorpc/GenesisInfo';
import { TarodNode, TaroNode } from 'shared/types';
import * as PTARO from 'lib/taro/types';
import { TaroService } from 'types';
import { waitFor } from 'utils/async';
import { tarodProxyClient as proxy } from './';

class TarodService implements TaroService {
  async listAssets(node: TaroNode): Promise<PTARO.TaroAsset[]> {
    const { assets } = await proxy.listAssets(this.cast(node));
    return assets.map<PTARO.TaroAsset>(asset => {
      // cast the nested object to be Required to avoid a bunch of
      // conditionals to please Typescript
      const genesis = asset.assetGenesis as Required<GenesisInfo>;
      const anchor = asset.chainAnchor as Required<AnchorInfo>;
      return {
        id: genesis.assetId.toString(),
        name: genesis.name,
        meta: Buffer.from(genesis.meta.toString(), 'hex').toString('ascii'),
        type: asset.assetType,
        amount: asset.amount,
        genesisPoint: genesis.genesisPoint,
        genesisBootstrapInfo: genesis.genesisBootstrapInfo.toString(),
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
      const genesis = asset.assetGenesis as Required<GenesisInfo>;
      balances.push({
        id,
        name: genesis.name,
        meta: Buffer.from(genesis.meta.toString(), 'hex').toString('ascii'),
        type: asset.assetType,
        balance: asset.balance,
        genesisPoint: genesis.genesisPoint,
        genesisBootstrapInfo: genesis.genesisBootstrapInfo.toString(),
      });
    });
    return balances;
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
