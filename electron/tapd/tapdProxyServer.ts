import { IpcMain } from 'electron';
import { debug } from 'electron-log';
import { readFile } from 'fs-extra';
import * as LND from '@lightningpolar/lnd-api';
import * as TAPD from '@lightningpolar/tapd-api';
import {
  convertUInt8ArraysToHex,
  ipcChannels,
  TapdDefaultsKey,
  withTapdDefaults,
} from '../../src/shared';
import { TapdNode } from '../../src/shared/types';
import { toJSON } from '../../src/shared/utils';

/**
 * mapping of node name <-> TapRpcApis to cache these objects. The createLndRpc function
 * reads from disk, so this gives us a small bit of performance improvement
 */
let rpcCache: Record<string, TAPD.TapdRpcApis> = {};

/**
 * Helper function to lookup a node by name in the cache or create it if
 * it doesn't exist
 */
const getRpc = async (node: TapdNode): Promise<TAPD.TapdRpcApis> => {
  const { name, networkId } = node;
  const id = `n${networkId}-${name}`;
  if (!rpcCache[id]) {
    const { ports, paths } = node as TapdNode;
    const options: TAPD.TapdClientOptions = {
      socket: `127.0.0.1:${ports.grpc}`,
      cert: (await readFile(paths.tlsCert)).toString('hex'),
      macaroon: (await readFile(paths.adminMacaroon)).toString('hex'),
    };
    rpcCache[id] = TAPD.TapClient.create(options);
  }
  return rpcCache[id];
};

const listAssets = async (args: { node: TapdNode }): Promise<TAPD.ListAssetResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.listAssets({
    includeLeased: true,
    withWitness: true,
  });
};

const listBalances = async (args: {
  node: TapdNode;
}): Promise<TAPD.ListBalancesResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.listBalances({
    assetId: true,
  });
};

const mintAsset = async (args: {
  node: TapdNode;
  req: TAPD.MintAssetRequestPartial;
}): Promise<TAPD.MintAssetResponse> => {
  const { mint } = await getRpc(args.node);
  return await mint.mintAsset(args.req);
};

const finalizeBatch = async (args: {
  node: TapdNode;
}): Promise<TAPD.FinalizeBatchResponse> => {
  const { mint } = await getRpc(args.node);
  return await mint.finalizeBatch();
};

const newAddress = async (args: {
  node: TapdNode;
  req: TAPD.NewAddrRequestPartial;
}): Promise<TAPD.Addr> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.newAddr(args.req);
};

const sendAsset = async (args: {
  node: TapdNode;
  req: TAPD.SendAssetRequestPartial;
}): Promise<TAPD.SendAssetResponse> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.sendAsset(args.req);
};

const decodeAddress = async (args: {
  node: TapdNode;
  req: TAPD.DecodeAddrRequestPartial;
}): Promise<TAPD.Addr> => {
  const { taprootAssets } = await getRpc(args.node);
  return await taprootAssets.decodeAddr(args.req);
};

const assetRoots = async (args: { node: TapdNode }): Promise<TAPD.AssetRootResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.assetRoots({ withAmountsById: true });
};

const assetLeaves = async (args: {
  node: TapdNode;
  req: TAPD.IDPartial;
}): Promise<TAPD.AssetLeafResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.assetLeaves(args.req);
};

const syncUniverse = async (args: {
  node: TapdNode;
  req: TAPD.SyncRequestPartial;
}): Promise<TAPD.SyncResponse> => {
  const { universe } = await getRpc(args.node);
  return await universe.syncUniverse(args.req);
};

const fundChannel = async (args: {
  node: TapdNode;
  req: TAPD.FundChannelRequestPartial;
}): Promise<TAPD.FundChannelResponse> => {
  const { channels } = await getRpc(args.node);
  return await channels.fundChannel(args.req);
};

const addInvoice = async (args: {
  node: TapdNode;
  req: TAPD.AddInvoiceRequestPartial;
}): Promise<TAPD.tapchannelrpc.AddInvoiceResponse> => {
  const { channels } = await getRpc(args.node);
  return await channels.addInvoice(args.req);
};

const sendPayment = async (args: {
  node: TapdNode;
  req: TAPD.tapchannelrpc.SendPaymentRequestPartial;
}): Promise<TAPD.tapchannelrpc.SendPaymentResponse> => {
  const { channels } = await getRpc(args.node);
  return new Promise((resolve, reject) => {
    let sellOrder: TAPD.PeerAcceptedSellQuote | undefined;
    const stream = channels.sendPayment(args.req);
    stream.on('data', (res: TAPD.tapchannelrpc.SendPaymentResponse) => {
      // This callback will be called multiple times for each payment attempt and once
      // with the accepted sell order.
      if (res.result === 'acceptedSellOrder') {
        // keep a reference to the accepted sell order which we'll return with the
        // payment result
        sellOrder = res.acceptedSellOrder ?? undefined;
      }

      // We only want to resolve the promise when the payment is successful or failed.
      if (res.result === 'paymentResult') {
        const pmt = res.paymentResult as TAPD.Payment;
        if (pmt.status === LND._lnrpc_Payment_PaymentStatus.SUCCEEDED) {
          // add the accepted sell order to the payment result before resolving
          res.acceptedSellOrder = sellOrder;
          resolve(res);
        } else if (pmt.status === LND._lnrpc_Payment_PaymentStatus.FAILED) {
          reject(new Error(`Payment failed: ${pmt.failureReason}`));
        }
      }
    });
    stream.on('error', err => reject(err));
    stream.on('end', () => reject(new Error('Stream ended without a payment result')));
  });
};

/**
 * A mapping of electron IPC channel names to the functions to execute when
 * messages are received
 */
const listeners: {
  [key: string]: (...args: any) => Promise<any>;
} = {
  [ipcChannels.tapd.listAssets]: listAssets,
  [ipcChannels.tapd.listBalances]: listBalances,
  [ipcChannels.tapd.mintAsset]: mintAsset,
  [ipcChannels.tapd.finalizeBatch]: finalizeBatch,
  [ipcChannels.tapd.newAddress]: newAddress,
  [ipcChannels.tapd.sendAsset]: sendAsset,
  [ipcChannels.tapd.decodeAddress]: decodeAddress,
  [ipcChannels.tapd.assetRoots]: assetRoots,
  [ipcChannels.tapd.assetLeaves]: assetLeaves,
  [ipcChannels.tapd.syncUniverse]: syncUniverse,
  [ipcChannels.tapd.fundChannel]: fundChannel,
  [ipcChannels.tapd.addInvoice]: addInvoice,
  [ipcChannels.tapd.sendPayment]: sendPayment,
};

/**
 * Sets up the IPC listeners for the main process and maps them to async
 * functions.
 * @param ipc the IPC object of the main process
 */
export const initTapdProxy = (ipc: IpcMain) => {
  debug('TapdProxyServer: initialize');
  Object.entries(listeners).forEach(([channel, func]) => {
    const requestChan = `tapd-${channel}-request`;
    const responseChan = `tapd-${channel}-response`;

    debug(`TapdProxyServer: listening for ipc command "${channel}"`);
    ipc.on(requestChan, async (event, ...args) => {
      // the a message is received by the main process...
      debug(`TapdProxyServer: received request "${requestChan}"`, toJSON(args));
      // inspect the first arg to see if it has a specific channel to reply to
      let uniqueChan = responseChan;
      if (args && args[0] && args[0].replyTo) {
        uniqueChan = args[0].replyTo;
      }
      try {
        // attempt to execute the associated function
        let result = await func(...args);
        // merge the result with default values since LND omits falsy values
        debug(`TapdProxyServer: send response "${uniqueChan}"`, toJSON(result));
        // add default values for missing objects
        result = withTapdDefaults(result, channel as TapdDefaultsKey);
        // convert UInt8Arrays to hex
        result = convertUInt8ArraysToHex(result);
        // response to the calling process with a reply
        event.reply(uniqueChan, result);
      } catch (err: any) {
        // reply with an error message if the execution fails
        debug(`TapdProxyServer: send error "${uniqueChan}"`, toJSON(err));
        event.reply(uniqueChan, { err: err.message });
      }
    });
  });
};

/**
 * Clears the cached rpc instances
 */
export const clearTapdProxyCache = () => {
  rpcCache = {};
};
