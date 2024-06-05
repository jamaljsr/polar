import * as TAP from '@lightningpolar/tapd-api';
import { TapdNode, TapNode } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import * as PTAP from 'lib/tap/types';
import { TapService } from 'types';
import { waitFor } from 'utils/async';
import { tapdProxyClient as proxy } from './';

class TapdService implements TapService {
  async decodeAddress(
    node: TapNode,
    req: TAP.DecodeAddrRequestPartial,
  ): Promise<PTAP.TapAddress> {
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
    node: TapNode,
    req: TAP.SendAssetRequestPartial,
  ): Promise<PTAP.TapSendAssetReceipt> {
    const res = await proxy.sendAsset(this.cast(node), req);
    const transfer = res.transfer as TAP.AssetTransfer;
    return {
      transferTxid: transfer.anchorTxHash.toString('hex'),
    };
  }

  async newAddress(
    node: TapNode,
    assetId: string,
    amt: string,
  ): Promise<PTAP.TapAddress> {
    const res = await proxy.newAddress(this.cast(node), {
      assetId: Buffer.from(assetId, 'hex').toString('base64'),
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
    node: TapNode,
    req: TAP.MintAssetRequestPartial,
  ): Promise<TAP.MintAssetResponse> {
    return await proxy.mintAsset(this.cast(node), req);
  }

  async finalizeBatch(node: TapNode): Promise<TAP.FinalizeBatchResponse> {
    return await proxy.finalizeBatch(this.cast(node));
  }

  async listAssets(node: TapNode): Promise<PTAP.TapAsset[]> {
    const { assets } = await proxy.listAssets(this.cast(node));
    return assets.map<PTAP.TapAsset>(asset => {
      // cast the nested object to be Required to avoid a bunch of
      // conditionals to please Typescript
      const genesis = asset.assetGenesis as Required<TAP.GenesisInfo>;
      const anchor = asset.chainAnchor as Required<TAP.AnchorInfo>;
      return {
        id: genesis.assetId.toString(),
        name: genesis.name,
        type: genesis.assetType,
        amount: asset.amount,
        genesisPoint: genesis.genesisPoint,
        anchorOutpoint: anchor.anchorOutpoint,
        groupKey: asset.assetGroup?.tweakedGroupKey.toString('hex') || '',
      };
    });
  }

  async listBalances(node: TapNode): Promise<PTAP.TapBalance[]> {
    const balances: PTAP.TapBalance[] = [];
    const res = await proxy.listBalances(this.cast(node), { assetId: true });
    Object.entries(res.assetBalances).forEach(([id, asset]) => {
      // cast the nested object to be Required to avoid a bunch of
      // conditionals to please Typescript
      const genesis = asset.assetGenesis as Required<TAP.GenesisInfo>;
      balances.push({
        id,
        name: genesis.name,
        type: genesis.assetType,
        balance: asset.balance,
        genesisPoint: genesis.genesisPoint,
      });
    });
    return balances;
  }

  async assetRoots(node: TapNode): Promise<PTAP.TapAssetRoot[]> {
    const { universeRoots } = await proxy.assetRoots(this.cast(node));
    const assetRoots: PTAP.TapAssetRoot[] = [];
    Object.values(universeRoots).forEach(root => {
      Object.entries(root.amountsByAssetId).forEach(([assetId, amount]) => {
        assetRoots.push({
          id: assetId,
          name: root.assetName,
          rootSum: parseInt(amount),
        });
      });
    });
    return assetRoots;
  }

  async syncUniverse(node: TapNode, universeHost: string): Promise<TAP.SyncResponse> {
    return await proxy.syncUniverse(this.cast(node), { universeHost });
  }

  async fundChannel(
    node: TapNode,
    peerPubkey: string,
    assetId: string,
    amount: number,
  ): Promise<string> {
    const req: TAP.FundChannelRequestPartial = {
      peerPubkey: Buffer.from(peerPubkey, 'hex').toString('base64'),
      assetId: Buffer.from(assetId, 'hex').toString('base64'),
      assetAmount: amount,
      feeRateSatPerVbyte: 50,
    };
    const { txid } = await proxy.fundChannel(this.cast(node), req);
    return txid;
  }

  async addAssetBuyOrder(
    node: TapNode,
    peerPubkey: string,
    assetId: string,
    amount: number,
  ): Promise<PTAP.BuyOrder> {
    const req: TAP.AddAssetBuyOrderRequestPartial = {
      peerPubKey: Buffer.from(peerPubkey, 'hex').toString('base64'),
      assetSpecifier: {
        assetId: Buffer.from(assetId, 'hex').toString('base64'),
      },
      minAssetAmount: amount,
      expiry: Math.floor(Date.now() / 1000 + 300), // 5 minutes from now
      timeoutSeconds: 60, // 1 minute
    };
    const res = await proxy.addAssetBuyOrder(this.cast(node), req);
    const acceptedQuote = res.acceptedQuote as TAP.PeerAcceptedBuyQuote;
    return {
      askPrice: acceptedQuote.askPrice,
      scid: acceptedQuote.scid,
    };
  }

  async addAssetSellOrder(
    node: TapNode,
    peerPubkey: string,
    assetId: string,
    maxAssetAmount: string,
    minAskMsat: string,
    expiry: string,
  ): Promise<PTAP.SellOrder> {
    const req: TAP.AddAssetSellOrderRequestPartial = {
      peerPubKey: Buffer.from(peerPubkey, 'hex').toString('base64'),
      assetSpecifier: {
        assetId: Buffer.from(assetId, 'hex').toString('base64'),
      },
      minAsk: minAskMsat,
      maxAssetAmount, // msat amount from the invoice
      expiry, // from the invoice
      timeoutSeconds: 60, // 1 minute
    };
    const res = await proxy.addAssetSellOrder(this.cast(node), req);
    const acceptedQuote = res.acceptedQuote as TAP.PeerAcceptedSellQuote;
    return {
      bidPrice: acceptedQuote.bidPrice,
      scid: acceptedQuote.scid,
      id: acceptedQuote.id.toString(),
    };
  }

  async encodeCustomRecords(node: TapNode, rfqId: string): Promise<PLN.CustomRecords> {
    const req: TAP.EncodeCustomRecordsRequestPartial = {
      routerSendPayment: {
        rfqId: Buffer.from(rfqId, 'hex').toString('base64'),
      },
      input: 'routerSendPayment',
    };
    const res = await proxy.encodeCustomRecords(this.cast(node), req);
    const records: PLN.CustomRecords = {};
    Object.keys(res.customRecords).forEach(key => {
      const keyNum = parseInt(key);
      const value = res.customRecords[keyNum].toString();
      records[keyNum] = Buffer.from(value, 'hex').toString('base64');
    });
    return records;
  }

  /**
   * Helper function to continually query the LND node until a successful
   * response is received or it times out
   */
  async waitUntilOnline(
    node: TapNode,
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

  private cast(node: TapNode): TapdNode {
    if (node.implementation !== 'tapd' && node.implementation !== 'litd')
      throw new Error(`TapdService cannot be used for '${node.implementation}' nodes`);

    return node as TapdNode;
  }
}

export default new TapdService();
